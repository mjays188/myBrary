let parameter = document.getElementById("search-parameter");
let input = document.getElementById("search-input");

parameter.addEventListener('change', () => {
    if(parameter.value=="pushlish_date"){
        input.type = 'date';
    }else{
        input.type = 'text';
    }
});
