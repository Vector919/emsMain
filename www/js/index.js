var DEBUG_MODE = true;
var backendURL = "http://159.203.98.25:3000/";
var dataOBJ = {}; // dataObj from file if exists
//store initial default messages in separate file (load them)
if(DEBUG_MODE){
  dataOBJ = {
    "owner" : {
      "username" : "Jerry Smith",
      "cellnumber" : "7258695545"
    },
    "coords":{
      "latitude" : 71.2555,
      "longitude" : 80.5555
    }
  };
}
/*
sample object
*
var dataOBJ = {
  "owner" : {
    "username" : "Jerry Smith",
    "cellnumber" : "7258695545"
  },
  "coords":{
    "latitude" : 71.2555,
    "longitude" : 80.5555
  },
  "messages" : [
    {
      "id" : 42,
      "msg" : "What is the meaning of life?",
      "emoji" : "😁",
      "contacts": [
        {
          "name": "BFF",
          "cellphone": "1238675309",
          "img" : "content://com.android.contacts/contacts/5/photo" //optional img
        }
      ]
    }
  ]
};/*
*/

var defaultMsgs = {
  "messages" : [
    // {
    //   "id" : 42,
    //   "msg" : "What is the meaning of life?",
    //   "emoji" : "😁",
    //   "contacts": [
    //     {
    //       "name": "BFF",
    //       "cellphone": "3213213222",
    //       "img" : "content://com.android.contacts/contacts/5/photo" //optional img
    //     }
    //   ]
    // },
    {
      "id"  : 0,
      "msg" : "Come to me, I don't feel safe.",
      "emoji" : "😱" //or could allow up to a certain number of characters
      /*
      "contacts" : [
        {
          "name": "Mom",
          "cellphone": "3424322344",
          "img" : "content://com.android.contacts/contacts/5/photo" //optional img
        },
        {
          "name": "Dad",
          "cellphone": "3424322346"
        },
        {
          "name": "BFF",
          "cellphone": "1238675309"
        }
      ]
      */
    },
    {
      "id"  : 1,
      "msg" : "I've been pulled over.",
      "emoji" : "🚨"
    },
    {
      "id"  : 2,
      "msg" : "Help, I've fallen and can't get back up!",
      "emoji" : "😨"
    },
    {
      "id"  : 3,
      "msg" : "Help, date gone bad!",
      "emoji" : "😁"
    }
  ]
};
var selectedContacts = {"contacts":[]};
var isgpsEnabled = true;

var app = {
    myDB: {},
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.loadDataObjFromDB(function(){
          if(dataOBJ.setup===true){
                  showPage(pages.length-1);
          }
          else{
            app.getContacts();
            app.gpsGetCurrentLocation();
          }
        });

        $('input[type=tel]').mask('(000) 000-0000');

        $("#contactSearch").on('input', function() {
            app.filterContacts(this.value,this);
        });

        if(DEBUG_MODE){
          $(".event.received").addClass("forceShow");
          $(".debug").addClass("forceShow");
        }
        setTimeout(function(){app.receivedEvent('deviceready');}, 1000);

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },



    //begin GPS related functions
    gpsEnabled: function(enable) {
      isgpsEnabled = enable = typeof enable !== 'undefined' ?  enable : isgpsEnabled;
      return enable; //change based on stored value + once dialog added
    },

    setGPS : function(bol) {
      bol = typeof bol !== 'undefined' ?  bol : '';
      if(bol===''){return "Please set a boolean value for setGPS()";}
      if(bol||!bol){
        app.gpsEnabled(bol);
        cLocal("GPS is <b>"+ (bol?"Enabled":"Disabled") + "</b>", "info");
      }
    },

    gpsGetCurrentLocation: function() {
      if(app.gpsEnabled()) {
        var onGPSSuccess = function(position) {
          if(DEBUG_MODE) {
            cLocal('Latitude: '          + position.coords.latitude          + '\n' +
                   'Longitude: '         + position.coords.longitude         + '\n' +
                   'Altitude: '          + position.coords.altitude          + '\n' +
                   'Accuracy: '          + position.coords.accuracy          + '\n' +
                   'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                   'Heading: '           + position.coords.heading           + '\n' +
                   'Speed: '             + position.coords.speed             + '\n' +
                   'Timestamp: '         + position.timestamp                + '\n',
                   'success');
            //if dataOBJ.coords !defined
            dataOBJ.coords = {}; //define as obj
            dataOBJ.coords.latitude = position.coords.latitude; //if pos.coords.lat is undefined, don't set.
            dataOBJ.coords.longitude = position.coords.longitude; //if pos.coords.lon is undefined, don't set.
          }
          else {
            cLocal('Location found', 'success');
          }
          //set values in DB and cache
        };

        // onError Callback receives a PositionError object
        //
        var onGPSError = function(error) {
          if(DEBUG_MODE) {
            cLocal('code: '+ error.code+'\n'+'message: '+error.message+'\n', 'danger');
          }
          else {
            cLocal('Location not found'+'<br />'+'Try enabling your GPS', 'danger');
          }
          //if gps is enabled, try again
        };

        navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError,
          {maximumAge: 1000, timeout: 50000, enableHighAccuracy: true});
      }
      else{
        cLocal('GPS is <b>Disabled</b>', 'info');
      }
    },
    //end GPS related functions




    //begin contacts related functions
    getContacts: function(filterOn){
        filterOn = typeof filterOn !== 'undefined' ?  filterOn : '';

        function onContactsSuccess(contacts) {
          contacts = {"contacts" : contacts};
          contacts.phone = function() {
            if(this.value !== null && this.value !== ''){
              var number = this.value.toString().replace(/[_\W]+/g, "");//removes extra characters and +1 from begining of numbers
              if(number.length>10)
              {
                  number = number.slice(1);
              }
              return number;
            }
            else {
              return null;
            }
          };

          var template = $('#contacts_temp').html();
          Mustache.parse(template);   // optional, speeds up future uses
          var rendered = Mustache.render(template, contacts);
          $('#contacts').html(rendered);
          $('#contactSearch').removeAttr('disabled');

          var con = $('#contacts').find("div.row");
          //might be filtering out names too?
          /*
          var seen={};
          $(con).find('select option').each(function() {
            var txt = $(this).text();
            if (seen[txt])
                $(this).remove();
            else
                seen[txt] = true;
          });
          */
          con.hide();
          //$(con).has('option').show();



          //$('#selectedContacts').html(JSON.stringify(contacts));
            /*
            //alert('Number of contacts: '+contacts.length);
            document.getElementById('contacts').innerHTML="";
            //push to template
            for (i = 0; i < contacts.length; i++) {
              var contact='';

              if (contacts[i].displayName  !== false && contacts[i].name.displayName  !== null) {
                  contact+="<td>";
                  if(contacts[i].photos && contacts[i].photos.length > 0) {
                      contact += "<img src='"+contacts[i].photos[0].value+"'><br />";
                  }
                  contact+=contacts[i].displayName+"</td>";
              }
              if (contacts[i].phoneNumbers !== null){
                  contact+="<td>";
                  if(contacts[i].phoneNumbers && contacts[i].phoneNumbers.length > 0) {
                    var number = contacts[i].phoneNumbers[0].value.toString().replace(/[_\W]+/g, "");

                    if(number.length>10)
                    {
                        number = number.slice(1);
                    }
                    contact+=number+"<br />";

                  }

                  contacts+="</td>";
              }
              else{
                  contact='';
              }
              if(contact!==''){
                  document.getElementById('contacts').innerHTML+="<tr>"+contact+"</tr>";
              }
              //document.getElementById('contacts').innerHTML+="<tr><td>"+JSON.stringify(contacts[i], null, 4)+"</td></tr>";

            }
            //endPush to template
            */
        }

        function onContactsError(contactError) {
            alert('contactError!'); //instead of alerts, maybe a more graceful msg
        }

        // find all contacts
        var options = new ContactFindOptions();
        options.filter = filterOn;
        options.multiple = true;
        options.hasPhoneNumber = true;
        var fields = ["*"];
        navigator.contacts.find(fields, onContactsSuccess, onContactsError, options);
    },
    filterContacts: function(filterOn,obj){
        filterOn = typeof filterOn !== 'undefined' ?  filterOn : '';
        var jo = $('#contacts').find("div.row");
        if(filterOn === ''){
          jo.hide();
          return;
        }
        var data = filterOn.toUpperCase().split(" ");

        if (this.value === "") {
            jo.hide();
            return;
        }
        jo.hide();
        //Recusively filter the jquery object to get results.
        jo.filter(function (i, v) {
            var $t = $(this);
            for (var d = 0; d < data.length; ++d) {
                if ($t.text().toUpperCase().indexOf(data[d]) > -1) {
                    return true;
                }
            }
            return false;
        })
        //show the rows that match.
        .has('option').show();

    },

    //select contacts
    selectContact : function(id) {
      //add contact to selectedContacts
      var img = $("#"+id).find(".userImg").attr("src");
      var name = $("#"+id).find(".userName").text();
      var phoneNum = $("#"+id).find(".phoneNumber").val();

      var contact = {"img":img,"name":name,"cellphone":phoneNum, "id":id};
      for(var i=0; i<selectedContacts.contacts.length; ++i){
        if(selectedContacts.contacts[i].cellphone===contact.cellphone)
        {
          contact=''; //don't add contact if already exists
        }
      }
      if(contact!==''){
        selectedContacts.contacts.push(contact);

        $('#contactSearch').val('');
        $('#contacts').find("div.row").hide();

        app.updateSelectedContacts();
      }
      //$('#selectedContacts').html(JSON.stringify(app.selectedContacts.contacts));

    },
    removeSelectedContact : function(id) {
      //remove contact from selectedContacts
      for(var i=0; i<selectedContacts.contacts.length; ++i){
        if(selectedContacts.contacts[i].id===id)
        {
          selectedContacts.contacts.splice(i, 1);
        }
      }
      app.updateSelectedContacts();
    },
    updateSelectedContacts : function(){
      template = $('#selectedContacts_temp').html();
      Mustache.parse(template);   // optional, speeds up future uses
      rendered = Mustache.render(template, selectedContacts);
      $('#selectedContacts').html(rendered);
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    },

    //end contacts related functions



    //begin message related functions
    loadMsgs: function(){
      var template = $('#msgs_temp').html();
      Mustache.parse(template);   // optional, speeds up future uses
      var rendered = Mustache.render(template, defaultMsgs);
      $('#msgs').html(rendered);

      template = $('#homeScreenButtons_temp').html();
      Mustache.parse(template);   // optional, speeds up future uses
      rendered = Mustache.render(template, defaultMsgs);
      $('#homeScreenButtons').html(rendered);
    },

    newMsgID: function(){
      var max = 0;
      for(i=0;i<defaultMsgs.messages.length;++i){
        max = (defaultMsgs.messages[i].id >= max ? defaultMsgs.messages[i].id+1 : max);
      }
      return max;
    },

    addMessage: function(msg,emo){
      defaultMsgs.messages.push({"id":app.newMsgID(),"msg":msg,"emoji":emo});
    },

    editButton : function(msgID){
      var id;
      for(i=0; i<defaultMsgs.messages.length;++i){
        if(defaultMsgs.messages[i].id == msgID){
          id=i;
        }
      }
      $("#setup_edit_message").val(defaultMsgs.messages[id].msg);
      $("#setup_edit_emoji").val(defaultMsgs.messages[id].emoji);
      $("#setup_edit_id").val(defaultMsgs.messages[id].id);

      if(defaultMsgs.messages[id].contacts!==undefined){
        selectedContacts.contacts = defaultMsgs.messages[id].contacts;
        app.updateSelectedContacts();
      }
      nextPage();
    },
    updateButton : function() {
      var id;
      var msgID = $("#setup_edit_id").val();
      for(i=0; i<defaultMsgs.messages.length;++i){
        if(defaultMsgs.messages[i].id == msgID){
          id=i;
        }
      }
      defaultMsgs.messages[id].msg = $("#setup_edit_message").val();
      defaultMsgs.messages[id].emoji = $("#setup_edit_emoji").val();
      defaultMsgs.messages[id].contacts = selectedContacts.contacts;
      selectedContacts.contacts=[];
      app.updateSelectedContacts();
      app.loadMsgs();
      previousPage();
    },
    cancelUpdateButton: function(){
      selectedContacts.contacts=[];
      app.updateSelectedContacts();
      previousPage();
    },
    //end message related functions

    //begin user related function
    updateUserInfo: function(name,phonenumber){
      //data validation
      dataOBJ.owner={"username":name,"cellnumber":phonenumber};
      //return success or an error
    },
    updateUserName: function(name){
      if(dataOBJ.owner === undefined){dataOBJ.owner={};}
      dataOBJ.owner.username = name.toString();
    },
    updateUserPhoneNumber: function(number){
      if(dataOBJ.owner === undefined){dataOBJ.owner={};}
      dataOBJ.owner.cellnumber = number.toString();
    },

    getUserInfo: function(){
      return dataOBJ.owner;
    },

    phoneMask: function(phoneNum){
      return true;
    },

    setupAddOwnerInfo : function(addOwnerInfo){
      if($('#name').val()!=='' && app.phoneMask($('#cellphone').val())){
        addOwnerInfo();
        nextPage();
      }
      else if($('#name').val()===''){
        splashErrorMsg("Missing your name.", "danger");
      }
      else if(app.phoneMask($('#cellphone').val())){
        splashErrorMsg("Missing your phone number.", "danger");
      }
      else{
        splashErrorMsg("Unknown Error", "danger blink");
      }
    },
    //end user related functions

    completeSetup: function(setup){
      setup = typeof setup !== undefined ?  setup : true;
      //verify that there is at least owner.cellnumber set and at least 1 button setup
      dataOBJ.messages=defaultMsgs.messages;
      dataOBJ.setup=true;
      //store dataOBJ
      //terrible code, fix with multifunctions and callbacks
      var myDB = window.sqlitePlugin.openDatabase({name: "mySQLite.db", location: 'default'});
      myDB.transaction(function(transaction) {
        transaction.executeSql('CREATE TABLE IF NOT EXISTS dataObj (id integer primary key, JSON text)', [],
        function(tx, result) {
          console.log("Table created successfully");

          myDB.transaction(function(transaction) {
            var executeQuery = "INSERT INTO dataObj (id,JSON) VALUES (?,?)";
            transaction.executeSql(executeQuery, [0, JSON.stringify(dataOBJ)],
            function(tx, result) {
              console.log('Inserted');
            },
            function(error){
              myDB.transaction(function(transaction) {
                var executeQuery = "DELETE FROM dataObj where id=?";
                transaction.executeSql(executeQuery, [0],
                //On Success
                function(tx, result) {console.log('Delete successfully');app.completeSetup();},
                //On Error
                function(error){console.log('Something went Wrong');});
              });
            });
          });

        },
        function(error) {
          console.log("Error occurred while creating the table.");
        });
      });

      updateUserName();
      updateUserPhoneNumber();
      $('.navbar-nav a[href="#home"]').tab('show');
      showPage(pages.length-1);

    },

    loadDataObjFromDB: function(call){
      var myDB = window.sqlitePlugin.openDatabase({name: "mySQLite.db", location: 'default'});
      myDB.transaction(function(transaction) {
        try {
          var success = false;
          transaction.executeSql('SELECT * FROM dataObj', [],
            function (tx, results) {
              success=true;
              if(DEBUG_MODE)
              {
                $('.DBresults').html("Results: " + results.rows.item(0).JSON);
              }
              dataOBJ = JSON.parse(results.rows.item(0).JSON);
              updateUserName();
              updateUserPhoneNumber();

              $("#defaultMsgs").attr("alt", defaultMsgs.messages);

              defaultMsgs.messages=dataOBJ.messages;
              app.loadMsgs();
              app.getContacts();
              app.gpsGetCurrentLocation();
              //alert(JSON.stringify(defaultMsgs.messages));
              setTimeout(function(){if(call){call();}}, 500);

            },
            function(error){if(call){call();}console.log('Not Setup');}
          );
          return success;
        }
        catch(e){
          return false;
        }
      }
    );
  },
  buttonAction: function(msgID){
    app.gpsGetCurrentLocation();
    var id;
    for(i=0; i < defaultMsgs.messages.length;++i){
      if(defaultMsgs.messages[i].id == msgID){
        id=i;
      }
    }
    //defaultMsgs.messages[id];
    //.id
    //.emoji
    //.msg
    //.contacts
    //alert("Message "+id+" would like to send a message."); // AJAX request to server to send message

    var message = defaultMsgs.messages[id];
    var phonenums=[];
    if(DEBUG_MODE){alert("The defaultMsgs.messages["+id+"] about to be sent...");alert(defaultMsgs.messages[id]);}
    for(var i=0; i<message.contacts.length; ++i){
      var num = message.contacts[i].cellphone.split(":")[0]; //split on : grab first part of array is b/c the phone numbers are stored with :work, :home, ...ect
      if(num.length<11){num="1"+num;}
      phonenums.push(num*1);
    }
    if(DEBUG_MODE){alert("Contacts: "+phonenums);}
    var request={
      message:(dataOBJ.owner.username!==undefined?dataOBJ.owner.username.toString():"From a friend")+": " +
            message.msg +
            "\n Location:\n\thttps://www.google.com/maps/place/"+dataOBJ.coords.latitude+","+dataOBJ.coords.longitude+"",
						contacts:phonenums
    };
    if(DEBUG_MODE){
      alert("Request to be sent...");
      alert(JSON.stringify(request));
      alert("About to do ajax requst...");
    }
    $.ajax({
        url: backendURL+"notify_sms",
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(request), //need to stringify for the server to accept it
        success: function( data, textStatus, jQxhr ){
          console.log(data);
          if(data!==undefined&&data!==''&&data.status==202){
            $('#response').html("<div class='alert alert-success alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Your message was successfully sent.<br /><a href=\"#\" class=\"btn btn-danger\" onclick='app.cancelAction("+msgID+")'>Send: Actually, I'm good.</a></div>");
          }
      		else {
      			$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Your message was not successfully sent.</div>");
      			if(DEBUG_MODE){
      				$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+data+"</div>");
      			}
      		}
        },
        error: function( jqXhr, textStatus, errorThrown ){
            console.log( errorThrown + textStatus + JSON.stringify(jqXhr));
      			if(DEBUG_MODE){
      				$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Error thown: "+errorThrown+"<br />"+JSON.stringify(jqXhr)+"</div>");
      			}
            else{
              $('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+(errorThrown?errorThrown:"Undefined Error, make sure GPS is enabled and you are connected to the internet")+"</div>");
            }
        },
        fail: function(){alert("CORS error");}

    });

  },
  cancelAction: function(msgID){
    app.gpsGetCurrentLocation();
    var id;
    for(i=0; i < defaultMsgs.messages.length;++i){
      if(defaultMsgs.messages[i].id == msgID){
        id=i;
      }
    }
    //defaultMsgs.messages[id];
    //.id
    //.emoji
    //.msg
    //.contacts
    //alert("Message "+id+" would like to send a message."); // AJAX request to server to send message

    var message = defaultMsgs.messages[id];
    var phonenums=[];
    if(DEBUG_MODE){alert("The defaultMsgs.messages["+id+"] about to be sent...");alert(defaultMsgs.messages[id]);}
    for(var i=0; i<message.contacts.length; ++i){
      var num = message.contacts[i].cellphone.split(":")[0]; //split on : grab first part of array is b/c the phone numbers are stored with :work, :home, ...ect
      if(num.length<11){num="1"+num;}
      phonenums.push(num*1);
    }
    if(DEBUG_MODE){alert("Contacts: "+phonenums);}
    var request={
      message:(dataOBJ.owner.username!==undefined?dataOBJ.owner.username.toString():"From a friend")+": " +
            "Nevermind, I'm good.",
						contacts:phonenums
    };
    if(DEBUG_MODE){
      alert("Request to be sent...");
      alert(JSON.stringify(request));
      alert("About to do ajax requst...");
    }
    $.ajax({
        url: backendURL+"notify_sms",
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(request), //need to stringify for the server to accept it
        success: function( data, textStatus, jQxhr ){
          console.log(data);
          if(data!==undefined&&data!==''&&data.status==202){
            $('#response').html("<div class='alert alert-success alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Your message was successfully sent.</div>");
          }
      		else {
      			$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Your message was not successfully sent.</div>");
      			if(DEBUG_MODE){
      				$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+data+"</div>");
      			}
      		}
        },
        error: function( jqXhr, textStatus, errorThrown ){
            console.log( errorThrown + textStatus + JSON.stringify(jqXhr));
      			if(DEBUG_MODE){
      				$('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>Error thown: "+errorThrown+"<br />"+JSON.stringify(jqXhr)+"</div>");
      			}
            else{
              $('#response').html("<div class='alert alert-danger alert-dismissible'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+(errorThrown?errorThrown:"Undefined Error, make sure GPS is enabled and you are connected to the internet")+"</div>");
            }
        },
        fail: function(){alert("CORS error");}

    });

  }


};


app.initialize();
app.loadMsgs();







//HTMLGPSHandling
function cLocal(response,success) {
    document.getElementById('currentLocation').innerHTML=response;
    document.getElementById('currentLocation').className = 'bg-'+success;
}
//EndHTMLGPSHandling
//HTMLSplashError
function splashErrorMsg(response,success) {
    document.getElementById('splashError').innerHTML=response;
    document.getElementById('splashError').className = 'bg-'+success;
}
//EndHTMLSplashError

//HTMLMessageHandling
var tmp = "";
function startCustomMsg() {
  var obj = document.getElementById("AddCustom");
  tmp=obj.innerHTML;
  var inputs = '<input type="text" id="msgInput" class="form-control input-lg" placeholder="Message"><br />';
  inputs    += '<input type="text" id="emojiInput" class="form-control input-lg" placeholder="Emoji"><br />';
  inputs    += '<a href="#" class="btn btn-success btn-lg btn-block" onclick="completeCustomMsg()">Add</a><br />';
  inputs    += '<a href="#" class="btn btn-default btn-lg btn-block" onclick="cancelCustomMsg()" size="1">Cancel</a>';
  obj.innerHTML=inputs;
  $("#buttonsSetupPageNav").hide();
}
function cancelCustomMsg() {
  var obj = document.getElementById("AddCustom");
  obj.innerHTML = tmp;
  $("#buttonsSetupPageNav").show();
}
function completeCustomMsg() {
  var msgIn = document.getElementById("msgInput").value.toString();
  var emoIn = document.getElementById("emojiInput").value.toString();
  app.addMessage(msgIn,emoIn);
  cancelCustomMsg();
  app.loadMsgs();
}
//EndHTMLMessageHandling

//HTMLOwnerHandling
function updateUserName() {
  $('#ownerName').val(dataOBJ.owner.username);
  $('#ownersName').html(dataOBJ.owner.username);
}
function updateUserPhoneNumber() {
  $('#ownerPhoneNumber').val(dataOBJ.owner.cellnumber);
}
//EndHTMLOwnerHandling
