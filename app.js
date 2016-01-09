var express = require('express');
var http = require('http');
var nconf = require('nconf');
var mongoose = require('mongoose');
var chalk = require('chalk');
var nodemailer = require('nodemailer');
var oboe = require('oboe');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

var server = http.createServer(app);
var io = require('socket.io')(server);

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
    var url = { host: '192.168.188.198', path: '/containers/json', port: 4243 };
    //var url = { host: '192.168.10.213', path: '/containers/json?all=1', port: 4243 };
    //var url = { host: '192.168.199.58', path: '/containers/json?all=1', port: 5555 };
    //var url = { host: '192.168.10.6', path: '/containers/json?all=1', port: 4243 };

    var dataToReturn = '';

    http.request(url, function (response) {
        response.on('data', function (chunk) {
            dataToReturn += chunk;
        });

        response.on('end', function () {
            res.status(200).send(JSON.stringify(dataToReturn));
        });
    }).end();
});

app.get('/stat', function (req, res) {
  var id = req.query.id;

  res.render('stat', id);
});

app.get('/nodeList', function (req, res) {
    //var url = { host: '192.168.199.58', path: '/info', port: 5556 };
    //var url = { host: '192.168.10.213', path: '/info', port: 5556 };
    var url = { host: '192.168.199.58', path: '/info', port: 5555 };
    //var url = { host: '192.168.188.198', path: '/info', port: 4243 };

    http.get(url, function (response) {
        response.on('data', function (chunk) {
            res.write(JSON.stringify(chunk.toString('utf8')));
        });

        response.on('end', function () {
            res.end();
        });
    }).on('error', function (error) {
        console.log(error);
    });
});

io.on('connection', function (socket) {
  socket.on('get memory stat', function (data) {

    var json = JSON.parse(data);

    var url = 'http://192.168.188.198:4243/containers/' + json.id + '/stats';
    //var url = 'http://192.168.10.213:4243/containers/' + json.id + '/stats';
    //var url = 'http://192.168.10.6:4243/containers/' + json.id + '/stats';

    oboe(url).node('usage', function (data) {
      var memory_usage = data / 1024 / 1024;

      io.emit('memory data changed', JSON.stringify({ 'memory_usage' : memory_usage }));
    });
  });

  socket.on('get cpu usage', function (data) {
    var json = JSON.parse(data);

    var url = 'http://192.168.188.198:4243/containers/' + json.id + '/stats';
    //var url = 'http://192.168.10.213:4243/containers/' + json.id + '/stats';
    //var url = 'http://192.168.10.6:4243/containers/' + json.id + '/stats';

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
});

function monitorContainer() {
  var url = { host: '192.168.188.198', path: '/containers/json', port: 4243 };
  //var url = { host: '192.168.10.213', path: '/containers/json?all=1', port: 4243 };
  //var url = { host: '192.168.199.58', path: '/containers/json?all=1', port: 5555 };
  //var url = { host: '192.168.10.6', path: '/containers/json?all=1', port: 4243 };

  var dataToReturn = '';

  http.request(url, function (response) {
    response.on('data', function (chunk) {
        dataToReturn += chunk;
    });

    response.on('end', function () {
      running_containers.Id = [];

      dataToReturn.forEach(function (element, index) {
        running_containers.Id.push(element.Id);
      });

      running_containers.forEach(function (element, index) {
        var url = 'http://192.168.188.198:4243/containers/' + element + '/stats';
        //var url = 'http://192.168.10.213:4243/containers/' + element + '/stats';
        //var url = 'http://192.168.10.6:4243/containers/' + element + '/stats';

        oboe(url).node('usage', function (data) {
          var memory_usage = data / 1024 / 1024;

          var CPU_USAGE = require('../model/')
        });
      });
    });
  }).end();
}
