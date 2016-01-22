var express = require('express');
var http = require('http');
var nconf = require('nconf');
var mongoose = require('mongoose');
var chalk = require('chalk');
var nodemailer = require('nodemailer');
var oboe = require('oboe');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');

var routes = require('./routes/monitor')(mongoose);

var app = express();

var server = http.createServer(app);
var io = require('socket.io')(server);

var one_minute = 5*1000;
var five_minute = 10*1000;
var half_hour = 15*1000;
var one_hour = 30*1000;
var twelve_hours = 45*1000;
var one_day = 60*1000;
var one_week = 75*1000;

var timer = [one_minute, five_minute, half_hour, one_hour, twelve_hours, one_day, one_week ];

var Cpu_usage_schema = require('./model/cpu_usage');
var Memory_usage_schema = require('./model/memory_usage');
var Network_usage_schema = require('./model/network_usage');
var PerCpu_usage_schema = require('./model/percpu_usage');
var IO_usage_schema = require('./model/io_usage');

var running_containers = {};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

nconf.file("db", './config/config.json');
mongoose.connect(nconf.get('dburl'));

server.listen(3000, '', function () {
  console.log(chalk.yellow('Server is running at ' + Date()));
});

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/email', function (req, res) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'dockerresourcemanagement@gmail.com',
            pass: 'akshayamitanishvivek'
        }
    });

    var mailOptions = {
        from: 'Akshay Soam <akshaysoam8@gmail.com>',
        to: 'dockerresourcemanagement@gmail.com',
        subject: 'Hello',
        text: 'Hi this is the first email',
        html: '<b>Hi there kiddo...!!!</b>'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        writeToConsole('Sending the mail');

        if (error) {
            writeToConsole('Error : ' + error);
            res.send('Error : ' + error);
        }

        else {
            writeToConsole('Message sent : ' + info.response);
            res.send('Message sent : ' + info.response);
        }
    });
});

app.get('/dockerData', function (req, res) {
  var url = 'http://' + nconf.get('anish-pc-router') + '/containers/json';

  request(url, function (error, response, body) {
    if(error)
      console.log(error);

    else
      res.send(JSON.stringify(body));
  });
});

app.get('/stat', function (req, res) {
  var id = req.query.id;

  res.render('stat', id);
});

app.get('/monitorCpuData', function (req, res) {
  var interval = req.query.interval;
  var id = req.query.id;

  var CPU_USAGE;

  if (interval == '1')
      CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'One_Minute_Cpu');

  if (interval == '2')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'Five_Minute_Cpu');

  if (interval == '3')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'Half_Hour_Cpu');

  if (interval == '4')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'One_Hour_Cpu');

  if (interval == '5')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'Twelve_Hour_Cpu');

  if (interval == '6')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'Half_Hour_Cpu');

  if (interval == '7')
    CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, 'Half_Hour_Cpu');

  var query = CPU_USAGE.Post.find({ container_Id : id }).sort({ 'date' : -1 }).limit(100);
  query.exec(function (err, docs) {
    res.send(JSON.parse(docs));
  });
});

app.get('/monitorMemoryData', function (req, res) {
  var interval = req.query.interval;
  var id = req.query.id;

  var MEMORY_USAGE;

  if (interval == '1')
      MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'One_Minute_Memory');

  if (interval == '2')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'Five_Minute_Memory');

  if (interval == '3')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'Half_Hour_Memory');

  if (interval == '4')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'One_Hour_Memory');

  if (interval == '5')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'Twelve_Hour_Memory');

  if (interval == '6')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'Half_Hour_Memory');

  if (interval == '7')
    MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, 'Half_Hour_Memory');

  var query = MEMORY_USAGE.Post.find({ container_Id : id }).sort({ 'date' : -1 }).limit(100);
  query.exec(function (err, docs) {
    res.send(JSON.parse(docs));
  });
});

app.get('/nodeList', function (req, res) {
    var url = 'http://' + nconf.get('vivek-pc-router') + '/info';

    request(url, function (error, response, body){
      if(error)
        console.log(error);

      res.send(JSON.stringify(body));
    });
});

app.get('/memoryData', function (req, res) {
  var interval = req.query.timer;
  var id = req.query.id;

  var MEMORY_USAGE = mongoose.model('Memory_usage', Memory_usage_schema, timer[interval - 1] + '_Memory');

  var query = MEMORY_USAGE.find({ });

  query.where('Id', id).limit(100).sort('-1');

  query.exec(function (err, docs) {
    if(err)
      console.log('query exec error');

    res.send(JSON.stringify(docs));
  });
});

app.get('/cpuData', function (req, res) {
  var interval = req.query.timer;
  var id = req.query.id;

  var CPU_USAGE = mongoose.model('Cpu_usage', Cpu_usage_schema, timer[interval - 1] + '_Cpu');

  var query = CPU_USAGE.find({ });

  query.where('Id', id).limit(100).sort('-1');

  query.exec(function (err, docs) {
    if(err)
      console.log('query exec error');

    res.send(JSON.stringify(docs));
  });
});

app.get('/percpuData', function (req, res) {
  var interval = req.query.timer;
  var id = req.query.id;

  var PERCPU_USAGE = mongoose.model('Percpu_usage', PerCpu_usage_schema, timer[interval - 1] + '_Percpu');

  var query = PERCPU_USAGE.find({ });

  query.where('Id', id).limit(100).sort('-1');

  query.exec(function (err, docs) {
    if(err)
      console.log('query exec error');

    res.send(JSON.stringify(docs));
  });
});

app.get('/ioData', function (req, res) {
  var interval = req.query.timer;
  var id = req.query.id;

  var IO_USAGE = mongoose.model('IO_usage', IO_usage_schema, timer[interval - 1] + '_IO');

  var query = IO_USAGE.find({ });

  query.where('Id', id).limit(100).sort('-1');

  query.exec(function (err, docs) {
    if(err)
      console.log('query exec error');

    res.send(JSON.stringify(docs));
  });
});

app.get('/networkData', function (req, res) {
  var interval = req.query.timer;
  var id = req.query.id;

  var NETWORK_USAGE = mongoose.model('Network_usage', Network_usage_schema, timer[interval - 1] + '_Network');

  var query = NETWORK_USAGE.find({ });

  query.where('Id', id).limit(100).sort('-1');

  query.exec(function (err, docs) {
    if(err)
      console.log('query exec error');

    res.send(JSON.stringify(docs));
  });
});

app.get('/customData', function (req, res) {
  var Id = req.query.Id;

  var data = {};

  var url = 'http://' + nconf.get('anish-pc-router') + '/containers/' + Id + '/stats?stream=false';

  request(url, function (error, response, body) {
    var previous_total_usage, previous_system_cpu_usage, number_of_cores;

    var json = JSON.parse(body);

    data.memory_usage = json.memory_stats.usage / 1024 / 1024;

    data.network = {};
    data.network.received_bytes_per_second = json.networks.eth0.rx_bytes;
    data.network.sent_bytes_per_second = json.networks.eth0.tx_bytes;

    data.percpu_usage = [];
    data.percpu_usage = json.precpu_stats.cpu_usage.percpu_usage;

    data.io = {};
    data.io.Read = json.blkio_stats.io_service_bytes_recursive[0].value;
    data.io.Write = json.blkio_stats.io_service_bytes_recursive[1].value;
    data.io.Sync = json.blkio_stats.io_service_bytes_recursive[2].value;
    data.io.Async = json.blkio_stats.io_service_bytes_recursive[3].value;
    data.io.Total = json.blkio_stats.io_service_bytes_recursive[4].value;

    previous_total_usage = json.precpu_stats.cpu_usage.total_usage;
    previous_system_cpu_usage = json.precpu_stats.system_cpu_usage;
    number_of_cores = json.precpu_stats.cpu_usage.percpu_usage.length;

    request(url, function (error, response, body) {
      if(error)
        console.log(error);

      var json = JSON.parse(body);

      var total_usage = json.precpu_stats.cpu_usage.total_usage;
      var system_cpu_usage = json.precpu_stats.system_cpu_usage;

      var total_usage_delta = total_usage - previous_total_usage;
      var system_cpu_usage_delta = system_cpu_usage - previous_system_cpu_usage;

      if ((system_cpu_usage_delta <= 0) || (total_usage_delta <= 0))
        data.cpu_usage = 0;

      else
        data.cpu_usage = total_usage_delta / system_cpu_usage_delta * number_of_cores * 100;

      res.send(JSON.stringify(data));
    });
  });
});

io.on('connection', function (socket) {
  var hostname = nconf.get('anish-pc-router');

  socket.on('get memory usage', function (data) {

    var json = JSON.parse(data);

    var url = 'http://' + hostname + '/containers/' + json.id + '/stats';

    oboe(url).node('usage', function (data) {
      var memory_usage = data / 1024 / 1024;

      io.emit('memory data changed', JSON.stringify({ 'memory_usage' : memory_usage }));
    });
  });

  socket.on('get cpu usage', function (data) {
    var json = JSON.parse(data);

    var url = 'http://' + hostname + '/containers/' + json.id + '/stats';

    var previous_total_usage = 0, previous_system_cpu_usage = 0, cpu_usage;

    oboe(url).node('cpu_stats', function (data) {
      var total_usage = data.cpu_usage.total_usage;
      var system_cpu_usage = data.system_cpu_usage;

      var total_usage_delta = total_usage - previous_total_usage;
      var system_cpu_usage_delta = system_cpu_usage - previous_system_cpu_usage;

      if ((system_cpu_usage_delta <= 0) || (total_usage_delta <= 0))
        cpu_usage = 0;

      else
        cpu_usage = total_usage_delta / system_cpu_usage_delta * data.cpu_usage.percpu_usage.length * 100;

      previous_total_usage = total_usage;
      previous_system_cpu_usage = system_cpu_usage;

      io.emit('cpu data changed', JSON.stringify({ 'cpu_usage': cpu_usage }));
    });
  });

  socket.on('get network usage', function (data) {

    var json = JSON.parse(data);

    console.log(json.id);

    var url = 'http://' + hostname + '/containers/' + json.id + '/stats';

    oboe(url).node('eth0', function (network_data) {
      io.emit('network data changed', JSON.stringify({ 'received_usage' : network_data.rx_bytes / 1024, 'sent_usage' : network_data.tx_bytes / 1024}));
    });
  });

  socket.on('get io usage', function (data) {

    var json = JSON.parse(data);

    console.log(json.id);

    var url = 'http://' + hostname +'/containers/' + json.id + '/stats';

    oboe(url).node('io_service_bytes_recursive', function (io_data) {
      io.emit('io data changed', JSON.stringify({ 'Read' : io_data[0].value, 'Write' : io_data[1].value, 'Sync' : io_data[2].value, 'Async' : io_data[3].value, 'Total' : io_data[4].value }));
    });
  });

  socket.on('get per cpu usage', function (data) {

    var json = JSON.parse(data);

    console.log(json.id);

    var url = 'http://' + hostname + '/containers/' + json.id + '/stats';

    oboe(url).node('percpu_usage', function (per_cpu_data) {
      io.emit('per cpu data changed', JSON.stringify(per_cpu_data));
    });
  });
});
