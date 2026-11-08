
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());

// Home route
app.get("/", (request, response) => {
    response.status(200).json({
        message: "Welcome to Books Management REST API",
        endpoints: {
            getAllBooks: "/books/",
            getBookById: "/books/:bookId/"
        }
    });
});

// Health check endpoint for Render / monitoring
app.get("/healthz", (request, response) => {
    response.status(200).json({ status: "OK" });
});

const databasePath = path.join(__dirname, "database", "books.db");

let db;

// GET all books with search, sorting, pagination and price filtering
app.get("/books/", async (request, response) => {
    const {
        search_q = "",
        order_by = "id",
        order = "ASC",
        limit = "10",
        offset = "0",
        min_price,
        max_price
    } = request.query;

    // Validate query parameter types
    if (
        typeof search_q !== "string" ||
        typeof order_by !== "string" ||
        typeof order !== "string" ||
        typeof limit !== "string" ||
        typeof offset !== "string" ||
        (min_price !== undefined && typeof min_price !== "string") ||
        (max_price !== undefined && typeof max_price !== "string")
    ) {
        return response.status(400).json({
            message: "Invalid query parameters"
        });
    }

    const allowedColumns = ["id", "title", "price", "pages"];
    const allowedOrders = ["ASC", "DESC"];

    const pageLimit = Number(limit);
    const pageOffset = Number(offset);

    const minPrice = min_price === undefined ? null : Number(min_price);
    const maxPrice = max_price === undefined ? null : Number(max_price);

    if (
        !allowedColumns.includes(order_by) ||
        !allowedOrders.includes(order.toUpperCase()) ||
        !Number.isInteger(pageLimit) || pageLimit < 1 ||
        !Number.isInteger(pageOffset) || pageOffset < 0 ||
        (min_price !== undefined &&
            (!Number.isFinite(minPrice) || minPrice < 0)) ||
        (max_price !== undefined &&
            (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice)
    ) {
        return response.status(400).json({
            message: "Invalid query parameters"
        });
    }

    let sql = `
        SELECT * FROM book
        WHERE title LIKE ?
    `;

    const params = [`%${search_q}%`];

    if (minPrice !== null) {
        sql += " AND price >= ?";
        params.push(minPrice);
    }

    if (maxPrice !== null) {
        sql += " AND price <= ?";
        params.push(maxPrice);
    }

    sql += ` ORDER BY ${order_by} ${order.toUpperCase()} LIMIT ? OFFSET ?`;

    params.push(pageLimit, pageOffset);

    try {
        const books = await db.all(sql, params);
        response.status(200).json(books);
    } catch (error) {
        response.status(500).json({
            message: "Unable to retrieve books"
        });
    }
});

// GET a book by ID
app.get("/books/:bookId/", async (request, response) => {
    try {
        const { bookId } = request.params;

        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        response.status(200).json(book);
    } catch (error) {
        response.status(500).json({
            message: "Unable to retrieve book"
        });
    }
});

// POST a new book
app.post("/books/", async (request, response) => {
    const { title, author, price, pages } = request.body;

    if (!title || typeof title !== "string" || !title.trim()) {
        return response.status(400).json({
            message: "Title is required"
        });
    }

    if (!author || typeof author !== "string" || !author.trim()) {
        return response.status(400).json({
            message: "Author is required"
        });
    }

    if (typeof price !== "number" || !Number.isFinite(price)) {
        return response.status(400).json({
            message: "Price must be a number"
        });
    }

    if (
        pages !== undefined &&
        (!Number.isInteger(pages) || pages < 0)
    ) {
        return response.status(400).json({
            message: "Pages must be a non-negative integer"
        });
    }

    try {
        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
             VALUES (?, ?, ?, ?)`,
            [title.trim(), author.trim(), price, pages ?? 0]
        );

        response.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID
        });
    } catch (error) {
        response.status(500).json({
            message: "Unable to add book"
        });
    }
});

// PUT - Update an existing book
app.put("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    if (
        typeof title !== "string" || !title.trim() ||
        typeof author !== "string" || !author.trim() ||
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        !Number.isInteger(pages) ||
        pages < 0
    ) {
        return response.status(400).json({
            message: "Please provide valid book details"
        });
    }

    try {
        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!existingBook) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        await db.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?`,
            [title.trim(), author.trim(), price, pages, bookId]
        );

        response.status(200).json({
            message: "Book updated successfully"
        });
    } catch (error) {
        response.status(500).json({
            message: "Unable to update book"
        });
    }
});

// DELETE a book
app.delete("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;

    try {
        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!existingBook) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        await db.run(
            "DELETE FROM book WHERE id = ?",
            [bookId]
        );

        response.status(200).json({
            message: "Book deleted successfully"
        });
    } catch (error) {
        response.status(500).json({
            message: "Unable to delete book"
        });
    }
});

// Initialize database and start server
async function initializeDBAndServer() {
    try {
        const databaseDir = path.dirname(databasePath);
        if (!fs.existsSync(databaseDir)) {
            fs.mkdirSync(databaseDir, { recursive: true });
        }

        db = await open({
            filename: databasePath,
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY,
                title TEXT,
                author TEXT,
                price INTEGER,
                pages INTEGER
            )
        `);

        const result = await db.get(
            "SELECT COUNT(*) AS count FROM book"
        );

        if (result.count === 0) {
            const books = [
                ["The Alchemist", "Paulo Coelho", 250, 208],
                ["Atomic Habits", "James Clear", 400, 320],
                ["Rich Dad Poor Dad", "Robert Kiyosaki", 350, 336],
                ["Clean Code", "Robert Martin", 550, 464],
                ["Wings of Fire", "A.P.J. Abdul Kalam", 300, 180],
                ["Deep Work", "Cal Newport", 380, 296],
                ["Ikigai", "Hector Garcia", 220, 194],
                ["Zero to One", "Peter Thiel", 320, 210],
                ["Think and Grow Rich", "Napoleon Hill", 280, 250],
                ["The Psychology of Money", "Morgan Housel", 450, 256]
            ];

            for (const book of books) {
                await db.run(
                    `INSERT INTO book
                     (title, author, price, pages)
                     VALUES (?, ?, ?, ?)`,
                    book
                );
            }
        }

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, "0.0.0.0", () => {
            console.log("Database initialized successfully");
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Database initialization failed:", error);
        process.exit(1);
    }
}

initializeDBAndServer();
