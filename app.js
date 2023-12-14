const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db;
const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server has been started");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndStartServer();

const hasPriorityAndStatusValues = (query) => {
  return query.priority !== undefined && query.status !== undefined;
};

const hasPriorityValue = (query) => {
  return query.priority !== undefined;
};

const hasStatusValue = (query) => {
  return query.status !== undefined;
};

//Get Todo's Based on Different Query Parameters API
app.get("/todos/", async (req, res) => {
  const { status, priority, search_q = "" } = req.query;
  let data;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatusValues(req.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE'%${search_q}%' 
            AND priority='${priority}' 
            AND status = '${status}';
          `;
      break;
    case hasPriorityValue(req.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'
        `;
      break;
    case hasStatusValue(req.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'
        `;
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
        `;
  }
  data = await db.all(getTodosQuery);
  res.send(data);
});

//Get a specific todo based on ID API
app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getTodosQuery = `
    SELECT * FROM todo
    WHERE id=${todoId} 
  `;
  const todo = await db.get(getTodosQuery);
  res.send(todo);
});

//Create a new todo in todo table API
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const createTodoQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        )
    `;
  const dbResponse = await db.run(createTodoQuery);
  res.send("Todo Successfully Added");
});

//Delete Todo Based on ID API
app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
        DELETE FROM todo WHERE id = ${todoId}
    `;
  const dbResponse = await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

//Update Todo name based on ID API
app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  let updateColumn = "";
  switch (true) {
    case req.body.status !== undefined:
      updateColumn = "Status";
      break;
    case req.body.priority !== undefined:
      updateColumn = "Priority";
      break;
    case req.body.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const prevTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const prevTodo = await db.get(prevTodoQuery);
  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
  } = req.body;

  const updateTodoQuery = `
    UPDATE todo 
    SET todo = '${todo}', priority = '${priority}', status = '${status}'
    WHERE id = ${todoId}
  `;
  const dbResponse = await db.run(updateTodoQuery);
  res.send(`${updateColumn} Updated`);
});

module.exports = app;
