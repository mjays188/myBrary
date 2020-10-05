let addNewAuthorBtn = document.getElementById("addNewAuthor");
let removeLastAuthorBtn = document.getElementById("removeLastAuthor");
let authorList = document.getElementById("authorList");
let addNewGenreBtn = document.getElementById("addNewGenre");
let removeLastGenreBtn = document.getElementById("removeLastGenre");
let genreList = document.getElementById("genreList");

const addInput = (parent, e) => {
    let newInputElement = document.createElement("input");
    newInputElement.setAttribute("class", "form-control mt-2");
    newInputElement.setAttribute("type", "text");
    switch(parent){
        case authorList:
            newInputElement.setAttribute("name", `authors[${parent.childElementCount-2}]`);
            newInputElement.setAttribute("placeholder", "Author name..");
        break;
        case genreList:
            newInputElement.setAttribute("name", `genres[${parent.childElementCount-2}]`);
            newInputElement.setAttribute("placeholder", "Enter Genre");
        break;
    }
    parent.insertBefore(newInputElement, e.target.parentNode);
}

const removeLastInput = (parent, e) => {
    if(parent.childElementCount > 3) {
        let nodeToBeRemoved = e.target.parentNode.previousSibling;
        parent.removeChild(nodeToBeRemoved);
    }
}

addNewAuthorBtn.addEventListener('click', (e) => {
    addInput(authorList, e);
});
removeLastAuthorBtn.addEventListener("click", (e) => { 
    removeLastInput(authorList, e);
});
addNewGenreBtn.addEventListener('click', (e) => {
    addInput(genreList, e);
});
removeLastGenreBtn.addEventListener("click", (e) => { 
    removeLastInput(genreList, e);
});
