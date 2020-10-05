const password1 = document.getElementsByClassName("password1")
const password2 = document.getElementsByClassName("password2")
var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
const signupBtn = document.getElementsByClassName("signup");
const errorMsg = document.getElementsByClassName("errorMsg");
//check pattern for paasword
const checkPattern = () => {
    console.log(password1[0].textContent);
    if(strongRegex.test(password1[0].innerHTML)){
        signupBtn.disabled = false;
        errorMsg[0].textContent = "";
    }else{
        signupBtn.disabled = true;
        errorMsg[0].textContent = "Password must contain at least 1 lowercase, 1 uppercase alphabet, 1 numeric character,at least one special character and must be eight characters or longer";
    };
}
//check if passwords are equal
const checkPassword = () => {
}