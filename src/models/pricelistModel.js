import pool from "../db/db.js";

export const getAll = async (searchParams = {}) => {
  let query = "SELECT * FROM pricelist WHERE 1=1";
  const values = [];
  let paramCount = 1;

  if (searchParams.article_no) {
    query += ` AND article_no ILIKE $${paramCount}`;
    values.push(`%${searchParams.article_no}%`);
    paramCount++;
  }

  if (searchParams.product_service) {
    query += ` AND product_service ILIKE $${paramCount}`;
    values.push(`%${searchParams.product_service}%`);
    paramCount++;
  }

  query += " ORDER BY id ASC";
  const { rows } = await pool.query(query, values);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM pricelist WHERE id = $1", [
    id,
  ]);
  return rows[0];
};

export const create = async (data) => {
  const values = [
    data.article_no,
    data.product_service,
    data.in_price,
    data.price,
    data.unit,
    data.in_stock,
    data.description,
  ];

  const { rows } = await pool.query(
    `INSERT INTO pricelist (article_no, product_service, in_price, price, unit, in_stock, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    values
  );
  return rows[0];
};

export const update = async (id, data) => {
  const { rows } = await pool.query(
    `UPDATE pricelist SET article_no=$1, product_service=$2, in_price=$3, price=$4, unit=$5, in_stock=$6, description=$7 
     WHERE id=$8 RETURNING *`,
    [...Object.values(data), id]
  );
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM pricelist WHERE id = $1", [
    id,
  ]);
  return rowCount;
};

export const bulkCreate = async (dataArray) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertPromises = dataArray.map((data) => {
      const values = [
        data.article_no,
        data.product_service,
        data.in_price,
        data.price,
        data.unit,
        data.in_stock,
        data.description,
      ];
      return client.query(
        `INSERT INTO pricelist (article_no, product_service, in_price, price, unit, in_stock, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        values
      );
    });
    const results = await Promise.all(insertPromises);
    await client.query("COMMIT");
    return results.map((r) => r.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllForExport = async () => {
  const { rows } = await pool.query(
    `
    SELECT article_no, product_service, in_price, price, unit, in_stock, description 
    FROM pricelist
    ORDER BY id ASC`
  );
  return rows;
};

export const bulkCreateFromCSV = async (dataArray) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const results = [];

    for (const data of dataArray) {
      const { rows } = await client.query(
        `INSERT INTO pricelist (article_no, product_service, in_price, price, unit, in_stock, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          data.article_no,
          data.product_service,
          parseFloat(data.in_price),
          parseFloat(data.price),
          data.unit,
          parseInt(data.in_stock),
          data.description,
        ]
      );
      results.push(rows[0]);
    }

    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
