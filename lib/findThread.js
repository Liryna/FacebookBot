var myFbId;
var find_myfacebookid = function(ids) {
    var freqs = {};
    var max_index;
    var max_value = -1/0;
    
    for (var x = 0; x < ids.length; x++) {
	if (freqs[ids[x]] != undefined) {
	    freqs[ids[x]]++;
	} else {
	    freqs[ids[x]] = 1;
	}
    }
    
    for (var x in freqs) {
	if (freqs[x] > max_value) {
	    max_value = freqs[x];
	    max_index = x;
	}
    }
    return max_index;
};


module.exports = {
    getParticipantsIds : function(arr) {
	var fbids = new Array();
	var fbidsTmp = new Array();
	
	//Get all usersId
	for (var i = 0; i < arr.length; i++) {
	    if (!arr[i].name) {
		for (var j = 0; j < arr[i].participants.length; j++) {
		    fbidsTmp.push(arr[i].participants[j].replace('fbid:',''));
		}
	    }
	}
	
	myFbId = find_myfacebookid(fbidsTmp);
	
	//Get all usersId and exclude your self
	for (var i = 0; i < fbidsTmp.length; i++) {
	    if (fbidsTmp[i] != myFbId)
		fbids.push(fbidsTmp[i]);
	}
	return fbids;
    },
    
    
    createThreads : function(arr, ret, cb) {
	var threadListTmp = new Array();
	var userIds = new Array();
	
	for(var prop in ret) {
	    userIds[prop] = ret[prop].name;
	}
	
	for (var i = 0; i < arr.length; i++) {
	    if (!arr[i].name) {
		var conversatioName = "";		
		for (var j = 0; j < arr[i].participants.length; j++) {
		    fbid = arr[i].participants[j].replace('fbid:','');
		    
		    if (userIds[fbid]) {
			if (conversatioName)
			    conversatioName += ",";
			conversatioName += userIds[fbid];
		    }
		}
		threadListTmp.push({threadID: arr[i].threadID,
				    name: conversatioName});
	    }
	    else 
		threadListTmp.push({threadID: arr[i].threadID,
				    name: arr[i].name});
	}
	
	var conversatioNames = new Array();
	var y = 0;
	for (var x in threadListTmp) {
	    if (conversatioNames[y] == undefined)
		conversatioNames[y] = new Array();
	    conversatioNames[y].push(threadListTmp[x].name);
	    if (conversatioNames[y].length == 2)
		y++;
	}
	
	cb(conversatioNames, threadListTmp);
    }
};

