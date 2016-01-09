window.onload = function () {
  $.ajax({
    url: '/nodeList',
    dataType: 'json',
    contentType: 'application/json',
    success: function (data) {
      var json = JSON.parse(data);

      var number_of_nodes, count = 0;

      $.each(json.DriverStatus, function (index, value) {
        if (value[0] == '\bNodes') {
          number_of_nodes = value[1];

          console.log(number_of_nodes);

          for (i = 1; count < number_of_nodes; i += 5, count++) {
            var client = json.DriverStatus[index + i];

            console.log(client);

            var colon_index = client[1].indexOf(':');

            var pc_name = client[0];
            var ip_address = client[1].slice(0, colon_index);
            var port = client[1].slice(colon_index + 1);

            var containers = json.DriverStatus[index + i + 1][1];

            $('.nodeList').append('<div class="client"><div class="pc_name"><img src="/images/pc.png" height="30px" width="30px"><label style="margin: 4px;">' + pc_name + '</label></div><div class="ip_address_port_number"><label><b>IP </b> : ' + ip_address + '</label><br /><label><b>Port</b> : ' + port + '</label><br /><label><b>Containers</b> : ' + containers + '</label></div></div>');

            $('.pc_name').hover(function () {
                $('.ip_address_port_number').show();
            }, function () {
                $('.ip_address_port_number').hide();
            });
          }

          return false;
        }
      });
    },
    error: function (xhr, status, error) {
      console.log(status);
    }
  });

  var cpuChart = new CanvasJS.Chart("cpuChartContainer", {
    title: {
        text: "CPU Usage"
    },
    width: $(window).width() * 0.9,
    data: [{
      type: "spline",
      dataPoints: [
		    { y: 0 },
		    { y: 0 },
    		{ y: 0 },
    		{ y: 0 }
      ]}
    ]
  });

  cpuChart.render();

  var memoryChart = new CanvasJS.Chart("memoryChartContainer", {
    title: {
      text: "Memory Usage"
    },
    width: $(window).width() * 0.9,
    data: [{
      type: "splineArea",
      dataPoints: [
		    { y: 0 },
		    { y: 0 },
		    { y: 0 },
		    { y: 0 }
      ]}
    ]
  });

  memoryChart.render();

  var socket = io.connect();

  var url = window.location.href;
  var id = url.substr(url.indexOf('=') + 1);

  socket.emit('get memory stat', JSON.stringify({ 'id': id }));
  socket.emit('get cpu usage', JSON.stringify({ 'id': id }));

  socket.on('memory data changed', function (data) {
    var json = JSON.parse(data);

    var length = memoryChart.options.data[0].dataPoints.length;

    memoryChart.options.data[0].dataPoints.push({ y: json.memory_usage });

    memoryChart.render();
  });

  socket.on('cpu data changed', function (data) {
    var json = JSON.parse(data);

    var length = cpuChart.options.data[0].dataPoints.length;

    cpuChart.options.data[0].dataPoints.push({ y: json.cpu_usage });
    cpuChart.render();
  });
}
