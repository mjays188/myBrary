let addNewAuthorBtn = document.getElementById("addNewAuthor");
let removeLastAuthorBtn = document.getElementById("removeLastAuthor");
let authorList = document.getElementById("authorList");
let addNewGenreBtn = document.getElementById("addNewGenre");
let removeLastGenreBtn = document.getElementById("removeLastGenre");
let genreList = document.getElementById("genreList");

const addInput = (parent, e) => {
    
    switch(parent){
        case authorList:
            let newDiv = document.createElement("div");
            newDiv.classList.add("input-group");
            newDiv.classList.add("mb-2");
            
            let childDiv1 = document.createElement("div"), childDiv2 = document.createElement("div");
            childDiv1.classList.add("input-group-prepend");
            childDiv2.classList.add("input-group-prepend");
            let span1 = document.createElement("span"), span2 = document.createElement("span");
            span1.classList.add("input-group-text");
            span1.innerText = " Name ";
            span2.classList.add("input-group-text");
            span2.innerText = " Image ";
            childDiv1.appendChild(span1);
            childDiv2.appendChild(span2);

            let childInput1 = document.createElement("input"), childInput2 = document.createElement("input");
            childInput1.classList.add("form-control");
            childInput2.classList.add("form-control");
            childInput1.setAttribute("name", `authors[${parent.childElementCount-2}][name]`);
            childInput1.setAttribute("type", "text");
            childInput1.setAttribute("required", "true");
            childInput1.setAttribute("placeholder", "Author name..");
            childInput2.setAttribute("name", `authors[${parent.childElementCount-2}][image]`);
            childInput2.setAttribute("type", "text");
            childInput2.setAttribute("placeholder", "Author image url..");
            childInput2.setAttribute("required", "true");

            newDiv.appendChild(childDiv1);
            newDiv.appendChild(childInput1);

            newDiv.appendChild(childDiv2);
            newDiv.appendChild(childInput2);

            parent.insertBefore(newDiv, e.target.parentNode);
        break;
        case genreList:
            let newInputElement = document.createElement("input");
            newInputElement.classList.add("form-control");
            newInputElement.setAttribute("type", "text");
            newInputElement.setAttribute("name", `genres[${parent.childElementCount-2}]`);
            newInputElement.setAttribute("placeholder", "Enter Genre");
            parent.insertBefore(newInputElement, e.target.parentNode);
        break;
    }
    
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
