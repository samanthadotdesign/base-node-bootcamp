import pg from 'pg';

const { Client } = pg;

const userInput = process.argv[2];

// Configure
const pgConnectionConfigs = {
  user: 'samanthalee',
  host: 'localhost',
  database: 'cat_owners',
  port: 5432, // Postgres server always runs on this port
};

const client = new Client(pgConnectionConfigs);
client.connect();

let sqlQuery = '';

switch (userInput) {
  case 'create-owner':
    const ownerName = process.argv[3];
    sqlQuery = `INSERT INTO owners (name) VALUES ('${ownerName}') RETURNING *`;
    client.query(sqlQuery, whenQueryDone);
    break;

  case 'create-cat':
    const catName = process.argv[4];

    // Create cat by using owner's name
    // CLI: node index.js create-cat <OWNER_NAME> <CAT_NAME>
    const ownerNameInput = process.argv[3];
    // ownerName = 'Jim'
    console.log(ownerNameInput);
    const ownerIdQuery = `SELECT id FROM owners WHERE name='${ownerNameInput}'`;
    // id that I can use inside cats table

    client.query(ownerIdQuery, (ownerError, ownerResult) => {
      const ownerId = ownerResult.rows[0].id;
      const catOwnerQuery = `INSERT INTO cats (name, owner_id) VALUES ('${catName}','${ownerId}')`;
      client.query(catOwnerQuery, whenQueryDone);
    });

    break;

  case 'cats':
    // id, name, owner_id
    const catsQuery = 'SELECT * FROM cats';

    client.query(catsQuery, (catQueryError, catQueryResult) => {
      if (catQueryError) {
        console.log('cat query error');
      } else {
      // catsObjArr [ { id: 1, name: Fluffy, owner_id: 1 }, {}, {}]
        const catsObjArr = catQueryResult.rows;

        // { id: 1, name: 'Fluffy', owner_id: 1 }
        catsObjArr.forEach((catObj, i) => {
          let printedLine = '';

          printedLine = `${catObj.id}. ${catObj.name}: `;

          const ownersQuery = `SELECT * FROM owners WHERE id=${catObj.owner_id}`;

          client.query(ownersQuery, (ownerQueryError, ownerQueryResult) => {
            if (ownerQueryError) {
              console.log('owner query error');
            }
            else {
              const ownerObj = ownerQueryResult.rows[0];
              printedLine += `Owner: ${ownerObj.name}`;
              console.log(printedLine);
            }
          });
        });
      }
    });
    break;

  case 'owners':
    // id, name, owner_id
    const ownersQuery = 'SELECT * FROM owners';

    client.query(ownersQuery, (ownerQueryError, ownerQueryResult) => {
      if (ownerQueryError) {
        console.log('owner query error');
      } else {
      // ownersObjArr [ { id: 1, name: Jim} {id: 2, name: Jo } ]
        const ownersObjArr = ownerQueryResult.rows;

        ownersObjArr.forEach((ownerObj, i) => {
          let printedLine = '';

          printedLine = `${ownerObj.id}. ${ownerObj.name}\n  - Cats:\n`;

          const catsQuery = `SELECT * FROM cats WHERE owner_id=${ownerObj.id}`;

          client.query(catsQuery, (catQueryError, catQueryResult) => {
            if (catQueryError) {
              console.log('cat query error');
            } else {
              const catObj = catQueryResult.rows;
              // Array of cat names
              const catNamesArr = catObj.map(({ name }) => name);
              catNamesArr.forEach((catName) => {
                printedLine += `    – ${catName}\n`;
              });
              console.log(printedLine);
            }
          });
        });
      }
    });
    break;

  default:
    console.log('No command');
}

// create the query done callback
const whenQueryDone = (error, result) => {
  // this error is anything that goes wrong with the query
  if (error) {
    console.log('error', error);
  } else {
    // rows key has the data
    console.log(result.rows);
  }

  // close the connection
  client.end();
};
