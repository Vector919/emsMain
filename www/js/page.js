// $(document).ready(function() {
//   $("input[type='checkbox']").parent().click(function(){
//     $(this).toggleClass('info');
//   });
// });


$('#pageTabs a').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
});

var pages = [
  'setup0',
  'setup1',
  'setup2',
  'setup3',
  'editButton',
  'addContacts',
  'main'
];

var setup=true; //set backend side if already setup
var currentPage=0; //keep track of current page

if(setup===false) {
  currentPage=pages.length-1;
}

function hideAll(){
  for(var i=0; i<pages.length; ++i){
    if(!$('#'+pages[i]).hasClass('hidden')) {
        $('#'+pages[i]).addClass('hidden');
    }
  }
}
function showPage(num) {
  currentPage = num = typeof num !== 'undefined' ?  num : 0;
  hideAll();
  $('#'+pages[num]).removeClass('hidden').hide().fadeIn(250);
}
$(document).ready(function() {
  showPage();
});
function nextPage(callback) {
  if(currentPage!==pages.length-1)
  {
    showPage(++currentPage);
  }
  if(callback) callback();
}
function previousPage(callback){
  if(currentPage!==0)
  {
    showPage(--currentPage);
  }
  if(callback) callback();
}
