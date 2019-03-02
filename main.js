const app = angular.module('OWL', [])

app.config(['$compileProvider', '$locationProvider', function($compileProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
    rewriteLinks: true
  })
  $locationProvider.hashPrefix('')

  $compileProvider.debugInfoEnabled(false); // more perf
}]);

app.filter('differentialFilter', function() {
  return function(num) {
    return num > 0 ? `+${num}` : num
  }
})

app.controller('MainCtrl', ['$http', '$scope', '$location', function($http, $scope, $location) {
  const vm = this
  vm.loading = true
  vm.error = false
  vm.year = $location.search().year ? +$location.search().year : 2019
  vm.sT = $location.search().tab || 'league'
  vm.data = null

  vm.tableSort
  vm.activeSort = 'match_wins'
  vm.tableReverse = true

  vm.years = [{
    id: 2018,
    name: '2018'
  }, {
    id: 2019,
    name: '2019'
  }]

  vm.tabs = [{
    id: 'league',
    name: 'Overall Standings'
  }, {
    id: 'stage1',
    name: 'Stage 1'
  }, {
    id: 'stage2',
    name: 'Stage 2'
  }, {
    id: 'stage3',
    name: 'Stage 3'
  }, {
    id: 'stage4',
    name: 'Stage 4'
  }]

  vm.setTab = tab => {
    vm.sT = tab

    if (tab === 'league') {
      $location.search('tab', null)
    } else {
      $location.search('tab', tab)
    }

    vm.tableSort = getOrderOptions()
  }

  vm.setYear = year => {
    if (vm.year === year && !vm.error) {
      return
    }

    vm.year = year

    if (year === 2019) {
      $location.search('year', null)
    } else {
      $location.search('year', year)
    }

    loadOwlData()
  }

  const sortOptions = {
    match_wins: ['match_wins', 'map_differential',  '-match_losses', 'map_win_percent'], // Order by wins then differential
    match_losses: ['match_losses', '-match_wins', '-map_differential', '-map_win_percent'] // Order by losses then differential
  }

  // Returns a custom order string that supports multiple order options so angular can do its shit
  // This is required because the fields we need to sort are nested deep and change depending on the tab we're on
  // and it's not something angular can handle on it's own.
  function getOrderOptions() {
    const sort = sortOptions[vm.activeSort] || vm.activeSort

    if (Array.isArray(sort)) {
      return sort.map(s => {
        const isReverse = s.startsWith('-')
        const str = isReverse ? s.substring(1) : s

        return `${isReverse ? '-' : ''}scores.${vm.sT}.${str}`
      })
    }

    return `scores.${vm.sT}.${sort}`
  }

  vm.tableSort = getOrderOptions()

  vm.sS = what => {
    if (vm.activeSort === what) {
      vm.tableReverse = !vm.tableReverse
    } else {
      vm.activeSort = what
      vm.tableSort = getOrderOptions()
      vm.tableReverse = false
    }
  }

  vm.gC = what => {
    if (vm.activeSort === what) {
      return `sort-amount-${vm.tableReverse ? 'desc' : 'asc'}`
    }
    return 'sort'
  }

  function mapScores(record) {
    const matchWinPercent = record.matchWin / (record.matchLoss + record.matchWin) * 100
    const mapWinPercent = record.gameWin / (record.gameLoss + record.gameWin + record.gameTie) * 100

    return {
      isStageWinner: record.isPlayoffWinner,
      match_wins: record.matchWin,
      match_losses: record.matchLoss,
      match_win_percent: !isNaN(matchWinPercent) ? matchWinPercent : null,
      map_wins: record.gameWin,
      map_losses: record.gameLoss,
      map_ties: record.gameTie,
      map_win_percent: !isNaN(mapWinPercent) ? mapWinPercent : null,
      map_differential: record.gameWin - record.gameLoss
    }
  }

  async function loadOwlData() {
    vm.loading = true
    vm.data = null

    try {
      const data = await $http.get(`https://api.overwatchleague.com/v2/standings?locale=en_US&season=${vm.year}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then(res => res.data.data)

      vm.data = data.map(team => ({
        name: team.name,
        abbreviated_name: team.abbreviatedName,
        img: team.logo.main.png,
        color: team.colors.primary.color,
        scores: {
          league: mapScores(team.league),
          ...Object.keys(team.stages).reduce((res, stage) => ({ ...res, [stage]: mapScores(team.stages[stage]) }), {})
        }
      }))

      console.log(vm.data)
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