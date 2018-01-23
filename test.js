console.log(getFormattedTime('12:00 PM', 'Thursday'));
console.log(getFormattedTime('12:05 PM', 'Thursday'));
function getFormattedTime(time, day){
    var matches = time.toLowerCase().match(/(\d{1,2}):(\d{2}) ([ap]m)/),
        output  = (parseInt(matches[1]) + (matches[3] == 'pm' ? 12 : 0)) + ':' + matches[2] + ':00',
        now = new Date();
    if (time.startsWith("12") && time.includes("PM")){
        output  = (parseInt(matches[1])) + ':' + matches[2] + ':00';
    }
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        year = now.getFullYear(),
        month = now.getMonth(),
        today = now.getDate(),
        todayIndex = now.getDay(),
        dayIndex = days.indexOf(day);

    var add = 0;

    if(todayIndex < dayIndex)  add = dayIndex-todayIndex;
    if(todayIndex > dayIndex) add = 7-(todayIndex-dayIndex);
    var newDate = new Date(year, month, today+add);
    var output = newDate.getFullYear()+'-'+(newDate.getMonth()+1)+'-'+newDate.getDate()+'T'+output;
    return output;
}