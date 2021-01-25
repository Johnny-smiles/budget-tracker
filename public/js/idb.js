// creating variable to hold db connection
let db;

// establising connection
const request = indexedDB.open("budget", 1);

// if database version is upgraded 
request.onupgradeneeded = ({ target }) => {
    // save to database
  let db = target.result;
  // creating object store.
  db.createObjectStore("pending", { autoIncrement: true });
};

// when successful
request.onsuccess = ({ target }) => {
    // saving db reference to global var
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
    //error log
  console.log("Woops! " + event.target.errorCode);
};
// opening new transaction with read/write permissions
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  
  const store = transaction.objectStore("pending");

  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  // get all records from store
  const getAll = store.getAll();

  // run function on successful getAll
  getAll.onsuccess = function() {
      // if stored data
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete records if successful
        // open one more transaction
        const transaction = db.transaction(["pending"], "readwrite");
        // access new transaction object store
        const store = transaction.objectStore("pending");
        // clear all items in store
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);