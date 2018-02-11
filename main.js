const app = angular.module('OWL', [])

app.config(['$compileProvider', function($compileProvider) {
  $compileProvider.debugInfoEnabled(false); // more perf
}]);

app.filter('differentialFilter', function() {
  return function(num) {
    return num > 0 ? `+${num}` : num
  }
})

app.controller('MainCtrl', ['$http', '$scope', function($http, $scope) {
  const vm = this
  vm.loading = true
  vm.error = false
  vm.data = null

  const sortOptions = {
    match_wins: ['match_wins', 'map_differential'],
    match_losses: ['match_losses', '-map_differential']
  }

  vm.activeSort = 'match_wins'
  vm.tableSort = sortOptions[vm.activeSort]
  vm.tableReverse = true

  vm.sS = what => {
    if (vm.activeSort === what) {
      vm.tableReverse = !vm.tableReverse
    } else {
      vm.tableSort = sortOptions[what] || what
      vm.activeSort = what
      vm.tableReverse = false
    }
  }

  vm.gC = what => {
    if (vm.tableSort === what) {
      return `sort-amount-${vm.tableReverse ? 'desc' : 'asc'}`
    }
    return 'sort'
  }

  async function loadOwlData() {
    try {
      const data = await $http.get('https://api.overwatchleague.com/standings?expand=team.content&locale=en_US', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then(res => res.data.ranks)

      vm.data = data.map(rank => {
        const team = rank.competitor
        const record = rank.records[0]
  
        return {
          abbreviated_name: team.abbreviatedName,
          name: team.name,
          img: team.logo,
          match_wins: record.matchWin,
          match_losses: record.matchLoss,
          match_win_percent: record.matchWin / (record.matchLoss + record.matchWin) * 100,
          map_wins: record.gameWin,
          map_losses: record.gameLoss,
          map_ties: record.gameTie,
          map_win_percent: record.gameWin / (record.gameLoss + record.gameWin + record.gameTie) * 100,
          map_differential: record.gameWin - record.gameLoss
        }
      })
    } catch (e) {
      console.error('Error loading owl data', e)
      vm.error = true
    } finally {
      vm.loading = false
      $scope.$digest()
    }
  }

  loadOwlData()
}])