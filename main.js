const app = angular.module('OWL', [])

app.config(['$compileProvider', function($compileProvider) {
  $compileProvider.debugInfoEnabled(false); // more perf
}]);

app.controller('MainCtrl', ['$http', '$scope', function($http, $scope) {
  const vm = this
  vm.loading = true
  vm.error = false
  vm.data = null

  vm.tableSort = 'match_wins'
  vm.tableReverse = true

  vm.setSort = what => {
    if (vm.tableSort === what) {
      vm.tableReverse = !vm.tableReverse
    } else {
      vm.tableSort = what
      vm.tableReverse = false
    }
  }

  vm.getClass = what => {
    if (vm.tableSort === what) {
      return `sort-amount-${vm.tableReverse ? 'desc' : 'asc'}`
    }
    return 'sort'
  }

  async function loadOwlData() {
    try {
      const data = await $http.get('https://api.overwatchleague.com/standings').then(res => res.data.ranks)
      vm.data = data.map(rank => {
        const team = rank.competitor
        const record = rank.records[0]
  
        return {
          abbreviated_name: team.abbreviatedName,
          name: team.name,
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