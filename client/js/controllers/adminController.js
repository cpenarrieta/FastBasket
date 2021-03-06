angular.module('fastBasket.admin', ['googlechart'])
.controller('adminController', function($scope, $http, $rootScope, $state, mySocket){
  $scope.new_orders = [];
  $scope.ready_orders = [];
  $scope.inprogress_orders = [];
  $scope.delivered_orders = [];
  $scope.mostpopularcategories = {};
  $scope.mostsolditems = {};
  $scope.totalitemssold = 0;
  $scope.totalorders = 0;
  $scope.totalsales = 0;
  $scope.rankhighestrevenueproduct = [];
  $scope.avgordersize = 0;
  $scope.avgordersales = 0;
  $scope.mostpopularcategoriesPerHour = {};
  $scope.mostsolditemsperhour = [];
  $scope.highestrevenuecategoryperhour = [];
  $scope.highestrevenueitemperhour = [];
  $scope.avgordersizeperhour = [];
  $scope.avgordersales = [];
  $scope.totalitemssoldperhour = [];
  $scope.totalordersperhour = {};
  $scope.totalsalesperhour = {};
  $scope.avgordersalesperhour = {};

  var initializeOrder = function(){
    $http({
      method: "GET",
      url: '/api/store/getDashboardOrders'
    })
    .then(function(orders){
      orders.data.forEach(function(order){
        if (order.status === 'pending'){
          $scope.new_orders.push(order);
        } else if (order.status === 'ready'){
          $scope.ready_orders.push(order);
        } else if (order.status === 'inProgress'){
          $scope.inprogress_orders.push(order);
        } else if (order.status === 'delivered'){
          $scope.delivered_orders.push(order);
        }
      });
    });
  };

  var initializeOrderStats = function(){
    $http({
      method: "GET",
      url: '/api/store/getStoreStats'
    })
    .then(function(results){
      buildChart_mostpopularcategories(results.data[0]);
      buildChart_mostsolditems(results.data[1]);
      $scope.totalitemssold = results.data[2][0].totalitemssold;
      $scope.totalorders = results.data[3][0].totalorders;
      $scope.totalsales = results.data[4][0].totalsales;
      // $scope.rankhighestrevenueproduct = results.data[5];
      $scope.avgordersize = results.data[6][0].avgordersize;
      $scope.avgordersales = results.data[7][0].avgordersales;
      // $scope.mostsolditemsperhour = results.data[9];
      // $scope.highestrevenuecategoryperhour = results.data[10];
      buildChart_mostpopularcategoriesPerHour(results.data[8]);
      // $scope.highestrevenueitemperhour = results.data[11];
      // $scope.avgordersizeperhour = results.data[12];
      buildChart_avgordersalesperhour(results.data[13]);
      // $scope.totalitemssoldperhour = results.data[14];

      buildChart_totalordersperhour(results.data[15]);
      buildChart_totalsalesperhour(results.data[16]);
    });
  };

  initializeOrder();
  initializeOrderStats();

  mySocket.on('new_order', function (data) {
    $scope.new_orders.push(data);
  });

  mySocket.on('ready_order', function (data) {
    for (var i=0; i<$scope.new_orders.length; i++){
      if (data.id === $scope.new_orders[i].id){
        $scope.new_orders.splice(i, 1);
        break;
      }
    }

    $scope.ready_orders.push(data);
  });

  mySocket.on('driver_assigned', function(data){
    for (var i=0; i<$scope.new_orders.length; i++){
      if (data.id === $scope.new_orders[i].id){
        $scope.new_orders[i].drivername = data.drivername;
        break;
      }
    }
  });

  mySocket.on('onmyway_order', function (data) {
    for (var i=0; i<$scope.ready_orders.length; i++){
      if (data.id === $scope.ready_orders[i].id){
        $scope.ready_orders.splice(i, 1);
        break;
      }
    }

    $scope.inprogress_orders.push(data);
  });

  mySocket.on('delivered_order', function (data) {
    for (var i=0; i<$scope.inprogress_orders.length; i++){
      if (data.id === $scope.inprogress_orders[i].id){
        $scope.inprogress_orders.splice(i, 1);
        break;
      }
    }

    $scope.delivered_orders.push(data);
  });

  var buildChart_mostpopularcategories = function(data){
    var rows = data.map(function(ele){
      return {c: [
        {v: ele.category },
        {v: parseInt(ele.mostpopularcategories, 10)}
      ]};
    });

    $scope.mostpopularcategories.type = "PieChart";
    $scope.mostpopularcategories.data = {"cols": [
      {id: "c", label: "Products", type: "string"},
      {id: "p", label: "Products Sold", type: "number"}
    ], "rows": rows};
  };

  var buildChart_mostsolditems = function(data){
    var rows = data.map(function(ele){
      return {c: [
        {v: ele.name },
        {v: parseInt(ele.mostsolditems, 10)}
      ]};
    });

    $scope.mostsolditems.type = "BarChart";
    $scope.mostsolditems.data = {"cols": [
      {id: "c", label: "Products", type: "string"},
      {id: "p", label: "Products Sold", type: "number"}
    ], "rows": rows};
  };

  var buildChart_totalsalesperhour = function(data){
    var rows = data.map(function(ele){
      return {c: [
        {v: (new Date(ele.timestamp)).getHours() + ":00" },
        {v: parseFloat(ele.totalsalesperhour, 10)}
      ]};
    });

    $scope.totalsalesperhour.type = "LineChart";
    $scope.totalsalesperhour.data = {"cols": [
      {id: "c", label: "Hour", type: "string"},
      {id: "p", label: "Sales ($)", type: "number"}
    ], "rows": rows};
  };

  var buildChart_totalordersperhour = function(data){
    var rows = data.map(function(ele){
      return {c: [
        {v: (new Date(ele.timestamp)).getHours() + ":00" },
        {v: parseFloat(ele.totalordersperhour, 10)}
      ]};
    });

    $scope.totalordersperhour.type = "LineChart";
    $scope.totalordersperhour.data = {"cols": [
      {id: "c", label: "Hour", type: "string"},
      {id: "p", label: "Orders", type: "number"}
    ], "rows": rows};
  };

  var buildChart_avgordersalesperhour = function(data){
    var rows = data.map(function(ele){
      return {c: [
        {v: (new Date(ele.timestamp)).getHours() + ":00" },
        {v: parseFloat(ele.avgordersales, 10)}
      ]};
    });

    $scope.avgordersalesperhour.type = "LineChart";
    $scope.avgordersalesperhour.data = {"cols": [
      {id: "c", label: "Hour", type: "string"},
      {id: "p", label: "Sales ($)", type: "number"}
    ], "rows": rows};
  };

  var buildChart_mostpopularcategoriesPerHour = function(data){
    var rows = [];
    var hours = [];

    data.forEach(function(ele){
      var validInsert = true;
      var hour = (new Date(ele.timestamp)).getHours() + ":00";
      for (var i=0; i<hours.length; i++){
        if (hour === hours[i].c[0].v){
          validInsert = false;
        }
      }

      if (validInsert){
        hours.push({ "c": [{ "v": hour }] });
      }
    });

    var categories = [{id: "c", label: "Hour", type: "string", p: {}}];
    data.forEach(function(ele){
      var validInsert = true;
      for (var i=0; i<categories.length; i++){
        if (categories[i].id === ele.category){
          validInsert = false;
        }
      }
      if (validInsert){
        categories.push({
          "id": ele.category,
          "label": ele.category,
          "type": "number",
          "p": {}
        });
      }
    });

    for (var i=0; i<hours.length; i++){
      for (var j=1; j<categories.length; j++){
        hours[i].c.push({ "v": 0, "id": categories[j].id });
      }
    }

    data.forEach(function(ele){
      var hour = (new Date(ele.timestamp)).getHours() + ":00";
      var categoryName = ele.category;
      for (var i=0; i<hours.length; i++){
        if (hours[i].c[0].v === hour){
          for (var j=1; j<hours[i].c.length; j++){
            if (hours[i].c[j].id === categoryName){
              hours[i].c[j].v = parseInt(ele.mostpopularcategories, 10);
              break;
            }
          }
          break;
        }
      }
    });

    rows = rows.concat(hours);

    $scope.mostpopularcategoriesPerHour.type = "AreaChart";
    $scope.mostpopularcategoriesPerHour.data =
    {
      "cols": categories,
      "rows": rows
    };
  };

});
