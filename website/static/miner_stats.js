
var workerHashrateData;
var workerHashrateChart;
var totalData;
var workerHistoryMax = 160;

var statData;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;

var option = indexOption();
var Chart = echarts.init(document.getElementById('minerChart'));
Chart.showLoading();
Chart.setOption(option);

function timeOfDayFormat(timestamp){
    var dStr = d3.time.format('%H:%M')(new Date(timestamp));
    if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
    return dStr;
}

function getWorkerNameFromAddress(w) {
    var worker = w;
    if (w.split(".").length > 1) {
        worker = w.split(".")[1];
        if (worker == null || worker.length < 1) {
            worker = "noname";
        }
    } else {
        worker = "noname";
    }
    return worker;
}

function buildChartData(){
    var workers = {};
    for (var w in statData.history) {
        var worker = getWorkerNameFromAddress(w);
        var a = workers[worker] = (workers[worker] || {
            hashrate: []
        });
        for (var wh in statData.history[w]) {
            a.hashrate.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
        }
        if (a.hashrate.length > workerHistoryMax) {
            workerHistoryMax = a.hashrate.length;
        }
    }

    var i = 0;
    workerHashrateData = [];
    //  console.log('workers='+JSON.stringify(workers));
    for (var worker in workers){
        workerHashrateData.push({
            key: worker,
            disabled: (i > Math.min((_workerCount-1), 0)),
            values: workers[worker].hashrate
        });
        i++;
    }
}

function updateChartData(){
    var workers = {};
    for (var w in statData.history) {
        var worker = getWorkerNameFromAddress(w);
        // get a reference to lastest workerhistory
        for (var wh in statData.history[w]) { }
        //var wh = statData.history[w][statData.history[w].length - 1];
        var foundWorker = false;
        for (var i = 0; i < workerHashrateData.length; i++) {
            if (workerHashrateData[i].key === worker) {
                foundWorker = true;
                if (workerHashrateData[i].values.length >= workerHistoryMax) {
                    workerHashrateData[i].values.shift();
                }
                workerHashrateData[i].values.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
                break;
            }
        }
        if (!foundWorker) {
            var hashrate = [];
            hashrate.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
            workerHashrateData.push({
                key: worker,
                values: hashrate
            });
            rebuildWorkerDisplay();
            return true;
        }
    }
    triggerChartUpdates();
    return false;
}

function calculateAverageHashrate(worker) {
    var count = 0;
    var total = 1;
    var avg = 0;
    for (var i = 0; i < workerHashrateData.length; i++) {
        count = 0;
        for (var ii = 0; ii < workerHashrateData[i].values.length; ii++) {
            if (worker == null || workerHashrateData[i].key === worker) {
                count++;
                avg += parseFloat(workerHashrateData[i].values[ii][1]);
            }
        }
        if (count > total)
            total = count;
    }
    avg = avg / total;
    return avg;
}

function triggerChartUpdates(){
    //workerHashrateChart.update();
}

function max(arr){
   // console.log('arr='+arr.length);
    if (arr.length > 0) {
      var maxNum = arr[0][1];
      for(var i = 1; i < arr.length; i++){
        if(arr[i][1] > maxNum){
           maxNum = arr[i][1];
        }
      }
      return maxNum;
   } else {
     // alert('矿工地址不存在或已下线');
      window.location = '../miners';
   }
}

function sortData(a,b){
    return a[0]-b[0];
}

function displayCharts() {
    var arr = {
        values: []
    };
    var grapthData = {
        key: "Final Force",
        disabled: false,
        values: []
    };
    for (var i = 0; i < workerHashrateData.length; i++) {
        var hashData = workerHashrateData[i].values;
        for (var j = 0; j < hashData.length; j++) {
            var time = 't' + hashData[j][0];
            if (arr.values[time] == undefined || arr.values[time] === null ) {
                arr.values[time] = new Array();
                arr.values[time].push(hashData[j][0]);
                arr.values[time].push(hashData[j][1]);
            } else {
                arr.values[time][1] += hashData[j][1];
            }
        }

    }
    for(var timestamp in arr.values){
        var x = parseInt(timestamp.split('t')[1]);
        var y = arr.values[timestamp][1];
        grapthData.values.push([x,y]);
    }
    grapthData.values = grapthData.values.sort(sortData);
    //console.log('arr='+arr);
    totalData = [];
    totalData.push(grapthData);

    var maxNum = max(totalData[0].values);
    var hashRate = [];
    //console.log(grapthData.values);
    for(var index = 0;index < grapthData.values.length;index+=10) {
        hashRate.push(grapthData.values[index]);
    }
    Chart.setOption({
        legend: {
            data: ['Final Force'],
            type: '',
            right: 55,
            selectedMode: false
        },
        series: [{
            name: 'Final Force',
            type: 'line',
            data: hashRate,
            smooth: true,
            lineStyle: {
                normal: {
                    width: 1.5
                }
            }
        }]
    })
    Chart.hideLoading();
    return true;
}

function updateStats() {
    totalHash = statData.totalHash;
    totalPaid = statData.paid;
    totalBal = statData.balance;
    totalImmature = statData.immature;
    totalShares = statData.totalShares;
    // do some calculations
    var _blocktime = 250;
    var _networkHashRate = parseFloat(statData.networkSols) * 1.2;
    var _myHashRate = (totalHash / 1000000) * 2;
    var luckDays =  ((_networkHashRate / _myHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
    // update miner stats
    $("#statsHashrate").text(getReadableHashRateString(totalHash));
    $("#statsHashrateAvg").text(getReadableHashRateString(calculateAverageHashrate(null)));
    $("#statsLuckDays").text(luckDays);
    $("#statsTotalImmature").text(totalImmature);
    /*$("#statsTotalBal").text(totalBal);*/
    $("#statsTotalPaid").text(totalPaid);
    $("#statsTotalShares").text(totalShares.toFixed(2));
}

function countTime(end) {
    var now = new Date().getTime();//当前时间
    var endTime = new Date(end).getTime(); //设置开始时间
    var leftTime = now - endTime; //时间差
    var count = false;
    var d,h,m,s;
    if (leftTime >= 0) {
        d = Math.floor(leftTime/1000/60/60/24);
        h = Math.floor(leftTime/1000/60/60%24);
        m = Math.floor(leftTime/1000/60%60);
        s = Math.floor(leftTime/1000%60);
    }
    //console.log(leftTime);
    if (leftTime >= 86400000) {
        return count = true;
    }
}

function formatDateTime2(timeStamp) {
            var date = new Date();
            date.setTime(timeStamp);
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            m = m < 10 ? ('0' + m) : m;
            var d = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            var h = date.getHours();
            h = h < 10 ? ('0' + h) : h;
            var minute = date.getMinutes();
            var second = date.getSeconds();
            minute = minute < 10 ? ('0' + minute) : minute;
            second = second < 10 ? ('0' + second) : second;
            return y + '-' + m + '-' + d+' '+h+':'+minute+':'+second;
};

function updateWorkerStats() {
    // update worker stats
    var i=0;
    for (var w in statData.workers) { i++;
        var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
        var saneWorkerName = getWorkerNameFromAddress(w);
        statData.workers[w].online = true;
        $("#statsHashrate"+htmlSafeWorkerName).text(getReadableHashRateString(statData.workers[w].hashrate));
        $("#statsHashrateAvg"+htmlSafeWorkerName).text(getReadableHashRateString(calculateAverageHashrate(saneWorkerName)));
        $("#statsLuckDays"+htmlSafeWorkerName).text(statData.workers[w].luckDays);
      //  $("#statsPaid"+htmlSafeWorkerName).text(statData.workers[w].paid);
        /*$("#statsBalance"+htmlSafeWorkerName).text(statData.workers[w].balance);*/
       // $("#statsShares"+htmlSafeWorkerName).text(Math.round(statData.workers[w].currRoundShares * 100) / 100);
        $("#statsDiff"+htmlSafeWorkerName).text(statData.workers[w].diff);
        $("#statsDate"+htmlSafeWorkerName).text(statData.workers[w].time);
    }
}
function addWorkerToDisplay(name, htmlSafeName, workerObj) {
    var htmlToAdd = "", workerName = "";
    //htmlToAdd+=`<th><small class="minerT13">${$.i18n.map.stLucky}</small></th>`;
   //console.log(name + '=' + workerObj.online);
    if (workerObj.online) {
        workerName = '<tr><td class="boxLowerHeader">'+name+'</td>';
    } else {
        if (countTime(workerObj.time)) {
            workerName = '<tr style="display:none;"><td class="boxLowerHeader">'+name+'</td>';
        } else {
            workerName = '<tr><td class="boxLowerHeader">' + name + ' <span class="offline minerT15">(offline)</span></td>';
        }
    }
    htmlToAdd+=workerName;
    htmlToAdd+='<td><span id="statsHashrate'+htmlSafeName+'">'+getReadableHashRateString(workerObj.hashrate)+'</span></td>';
    htmlToAdd+='<td><span id="statsHashrateAvg'+htmlSafeName+'">'+getReadableHashRateString(calculateAverageHashrate(name))+'</span></td>';
    htmlToAdd+='<td><span id="statsDiff'+htmlSafeName+'">'+workerObj.diff+'</span></td>';
   // htmlToAdd+='<td><span id="statsShares'+htmlSafeName+'">'+(Math.round(workerObj.currRoundShares * 100) / 100)+'</span></td>';
   // htmlToAdd+='<td><span id="statsLuckDays'+htmlSafeName+'">'+workerObj.luckDays+'</span></td>';
   // htmlToAdd+='<td><span id="statsPaid'+htmlSafeName+'">'+workerObj.paid+'</span></td>';
    htmlToAdd+='<td><span id="statsDate'+htmlSafeName+'">'+formatDateTime2(workerObj.time)+'</span></td></tr>';

    $("#boxesWorkers tbody").html($("#boxesWorkers tbody").html()+htmlToAdd);
    // window.location.reload();
}


function rebuildWorkerDisplay() {
    $("#boxesWorkers tbody").html("");
    var y = 0, workers = [], newWorkers = [];
    for (var wh in statData.history) {
        var whName = wh.split('.').join('_').replace(/[^\w\s]/gi, '');
        var time = statData.history[wh][statData.history[wh].length-1].time;
        var hashrate = statData.history[wh][statData.history[wh].length-1].hashrate;
        var shortName = getWorkerNameFromAddress(wh);
        var obj = {
            time: (new Date(time*1000)),
            title: whName,
            name: shortName,
            hashrate: hashrate,
        }
        newWorkers[shortName] = obj;
    }
    for (var w in statData.workers) { y++;
        var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
        var saneWorkerName = getWorkerNameFromAddress(w);
        statData.workers[w].name = saneWorkerName;
        statData.workers[w].title = htmlSafeWorkerName;
        statData.workers[w].online = true;
        workers[saneWorkerName] = statData.workers[w];
    }
    for (var index in workers) {
        workers[index].time = newWorkers[workers[index].name].time;
    }

    for(var j in newWorkers){
        if(workers[j] == undefined || workers[j] == null){
            workers[j] = {
                name: newWorkers[j].name,
                time: newWorkers[j].time,
                hashrate: newWorkers[j].hashrate,
                online: false,
                diff: 0,
                balance: 0,
                paid: 0,
                luckDays: 0,
                currRoundShares: 0,
            }
        }
    }
    //排序
    var newArr = Object.keys(workers).sort(function(a, b) {
        var f = parseInt(a.replace(/[a-z\s]/ig,''), 10);
        var s = parseInt(b.replace(/[a-z\s]/ig,''), 10);
        if (f > s) {
            return 1;
        } else if (f < s) {
            return -1;
        } else {
            return 0;
        }
    });

    for (var x in newArr) {
        addWorkerToDisplay(workers[newArr[x]].name, workers[newArr[x]].title, workers[newArr[x]]);
    }
}

// resize chart on window resize
//nv.utils.windowResize(triggerChartUpdates);

// grab initial stats
$.getJSON('/api/worker_stats?'+_miner, function(data){
    statData = data;
    //for (var w in statData.workers) { _workerCount++; }
    buildChartData();
    displayCharts(data);
    rebuildWorkerDisplay();
    updateStats();
    // window.translate();
});

// live stat updates
statsSource.addEventListener('message',dealWithEventListener); 
function dealWithEventListener(e){
	// TODO, create miner_live_stats...
    // miner_live_stats will return the same josn except without the worker history
    // FOR NOW, use this to grab updated stats
    $.getJSON('/api/worker_stats?'+_miner, function(data){
        statData = data;
        // check for missing workers
        var wc = 0;
        var rebuilt = false;

        // update worker stats
        for (var w in statData.workers) { wc++; }
        // TODO, this isn't 100% fool proof!
//        if (_workerCount != wc) {
//            if (_workerCount > wc) {
                rebuildWorkerDisplay();
                rebuilt = true;
 //           }
            _workerCount = wc;
 //       }
        rebuilt = (rebuilt || updateChartData());
        updateStats();
        if (!rebuilt) {
            updateWorkerStats();
        }
        displayCharts();
    });
}

