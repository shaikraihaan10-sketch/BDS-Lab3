# SQLite Books Management REST API

## Project Description

This project is a RESTful API developed using Node.js, Express.js, and SQLite. It allows users to manage book records through CRUD operations. It also supports searching, sorting, pagination, price-range filtering, input validation, and proper error handling.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript
- Postman

## Project Structure

```text
lab-03-bdf/
├── database/
│   └── books.db
├── screenshots/
│   ├── get_all_books.png
│   ├── get_bookId.png
│   ├── post_newBook.png
│   ├── put_book.png
│   ├── delete.png
│   └── 404.png
├── .gitignore
├── app.js
├── package.json
├── package-lock.json
└── README.md
```

## Installation and Execution

1. Install the dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Server URL:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books/` | Retrieve all books |
| GET | `/books/:bookId/` | Retrieve a book by ID |
| POST | `/books/` | Add a new book |
| PUT | `/books/:bookId/` | Update an existing book |
| DELETE | `/books/:bookId/` | Delete a book |

## Query Parameters

The GET `/books/` endpoint supports the following query parameters:

| Parameter | Description |
|---|---|
| `search_q` | Search books using a partial title |
| `order_by` | Select the field used for sorting |
| `order` | Sort in ascending or descending order |
| `limit` | Set the maximum number of records |
| `offset` | Skip a specified number of records |
| `min_price` | Set the minimum book price |
| `max_price` | Set the maximum book price |

### Example Requests

Search books:

```text
http://localhost:3000/books/?search_q=the
```

Sort books by price:

```text
http://localhost:3000/books/?order_by=price&order=ASC
```

Pagination:

```text
http://localhost:3000/books/?limit=3&offset=0
```

Filter by price range:

```text
http://localhost:3000/books/?min_price=250&max_price=500
```

## Input Validation and Status Codes

The API validates incoming data and returns appropriate HTTP status codes.

| Status Code | Description |
|---|---|
| 200 OK | Request completed successfully |
| 201 Created | New book added successfully |
| 400 Bad Request | Invalid or missing input |
| 404 Not Found | Requested book does not exist |

Error responses use a consistent JSON message format.

## Additional Features

- CRUD operations for book records.
- Search books by partial title.
- Sort books using selected fields.
- Pagination using `limit` and `offset`.
- Filter books by minimum and maximum price.
- Validate POST request data.
- Handle unavailable book IDs with 404 responses.
- Use parameterized SQL queries.

## Testing

All API endpoints are tested using Postman.

The testing includes:
- Retrieving all books.
- Retrieving a book using its ID.
- Adding a new book.
- Updating an existing book.
- Deleting a book.
- Testing unavailable book IDs.
- Testing search, sorting, pagination, and price filters.
- Testing invalid input and validation responses.

Screenshots of the Postman requests and responses are stored in the `screenshots/` folder.

## Database

SQLite is used to store book records in `database/books.db`.

The database contains a `book` table with the following fields:

- `id`
- `title`
- `author`
- `price`
- `pages`

## Debugging

The project includes practice in identifying and resolving common backend development errors, including:

- Port conflicts (`EADDRINUSE`).
- Incorrect import paths.
- Database table-name errors.
- Missing `await` statements.

## Deploying to Render

This API is configured for seamless deployment on [Render](https://render.com/).

### Option 1: Automatic Blueprint Deployment (Recommended)
1. Push this repository to GitHub.
2. Sign in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect this GitHub repository (`BDS-Lab3`).
5. Render will automatically detect `render.yaml` and configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 20
6. Click **Apply** to deploy.

### Option 2: Manual Web Service Deployment
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`BDS-Lab3`).
4. Configure the service settings:
   - **Name:** `bds-lab3` (or any preferred name)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
5. Under **Advanced / Environment Variables**, add:
   - `NODE_VERSION`: `20`
6. Click **Create Web Service**.

Once deployed, your API will be live at `https://<your-service-name>.onrender.com/`.

## Conclusion

This project demonstrates the development of a RESTful API using Node.js, Express.js, and SQLite. It provides CRUD functionality along with searching, sorting, pagination, price filtering, input validation, and error handling.
