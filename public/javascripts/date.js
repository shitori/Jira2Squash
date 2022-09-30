var date = new Date("2022-07-09")

console.log("next episode : "+newEpisode(date))

function format(inputDate) {
  let date, month, year;

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();

    date = date
        .toString()
        .padStart(2, '0');

    month = month
        .toString()
        .padStart(2, '0');

  return `${date}/${month}/${year}`;
}

function newEpisode(inputDate){
  while(inputDate< new Date()){
    inputDate.setDate(inputDate.getDate()+7)
    console.log(format(inputDate))
  }
  return format(inputDate)
}

