
/**
 * TITLE        : Message method
 * DESCRIPTION  : Get`s message datetime format(d.m)
 *
 */
const formatdate = function (datetime, fullDate) {

    let newDate = '';
    let newDay  = datetime.getDate();
    let newYear = datetime.getFullYear();

    if(new Date().getMonth() === datetime.getMonth()) {
        if(new Date().getDate() === datetime.getDate()) {
            if(!fullDate) {
                newDate = 'Сегодня';
                return newDate;
            }
        }
    }
    switch(datetime.getMonth()) {
        case 1:  newDate = declension(newDay, ['январь', 'января', 'января']);          break;
        case 2:  newDate = declension(newDay, ['февраль', 'февраля', 'февраля']);       break;
        case 3:  newDate = declension(newDay, ['март', 'марта', 'февраля']);            break;
        case 4:  newDate = declension(newDay, ['апрель', 'апреля', 'апреля']);          break;
        case 5:  newDate = declension(newDay, ['май', 'мая', 'мая']);                   break;
        case 6:  newDate = declension(newDay, ['июнь', 'июня', 'июня']);                break;
        case 7:  newDate = declension(newDay, ['июль', 'июля', 'июля']);                break;
        case 8:  newDate = declension(newDay, ['август', 'августа', 'августа']);        break;
        case 9:  newDate = declension(newDay, ['сентябрь', 'сентября', 'сентября']);    break;
        case 10: newDate = declension(newDay, ['октябрь', 'октября', 'октября']);       break;
        case 11: newDate = declension(newDay, ['ноябрь', 'ноября', 'ноября']);          break;
        case 12: newDate = declension(newDay, ['декабрь', 'декабря', 'декабря']);       break;
    }

    if(fullDate) {
        return newDay+ ' ' +newDate+ ' ' +newYear;
    }
    return newDay+ ' ' +newDate;

    function declension(number, titles) {
        let cases = [2, 0, 1, 1, 1, 2];
        return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
    }
}

module.exports = {
    formatdate
};