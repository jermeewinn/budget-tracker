let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store (table) called 'new_expense'
    db.createObjectStore('new_expense', { autoIncrement: true });
};

request.onsuccess = function (event) {
    //when db is successfully created with its object store, save reference to db in global variable
    db = event.target.result;
    //check if app is online, if yes run 'uploadExpense()' function to send all local db data to api
    if (navigator.online) {
        uploadExpense();
    }
};

request.onerror = function (event) {
    //log error here
    console.log(event.target.errorCode);
};

//This function will execute if we attempt to make an entry w/o an internet connection
function saveRecord(record) {
    //open a new transx w/ the db w/ read/write permissions
    const transaction = db.transaction(['new_expense'], 'readwrite');
    //access the obj store for 'new_expense'
    const expenseObjectStore = transaction.objectStore('new_expense');
    //add record to your store w/ add method
    expenseObjectStore.add(record);
};

function uploadExpense() {
    //open a transaction on your db
    const transaction = db.transaction(['new_expense'], 'readwrite');
    //access your object store
    const expenseObjectStore = transaction.objectStore('new_expense');
    //get all records from store and set to a var
    const getAll = expenseObjectStore.getAll();

    getAll.onsuccess = function() {
        //if there was data in idb's store, we'll send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse)
                    }
                    //open one more transx
                    const transaction = db.transaction(['new_expense'], 'readwrite');
                    const expenseObjectStore = transaction.objectStore('new_expense');
                    expenseObjectStore.clear();

                    alert('All saved expenses have been submitted.');
                })
                .catch(err => {
                    console.log(err);
                });

        }
    };
};

//listen for app to come back online
window.addEventListener('online', uploadExpense);