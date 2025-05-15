import * as Pricelist from "../models/pricelistModel.js";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import fs from "fs/promises";

export const getAllPricelist = async (req, res, next) => {
  try {
    const { article_no, product_service } = req.query;
    const searchParams = {
      article_no: article_no || "",
      product_service: product_service || "",
    };

    const rows = await Pricelist.getAll(searchParams);
    res.status(200).json({
      success: true,
      message: "Pricelist items retrieved successfully",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getPricelistById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        data: null,
      });
    }

    const row = await Pricelist.getById(id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Pricelist item not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pricelist item retrieved successfully",
      data: row,
    });
  } catch (error) {
    next(error);
  }
};

export const createPricelist = async (req, res, next) => {
  try {
    const {
      article_no,
      product_service,
      in_price,
      price,
      unit,
      in_stock,
      description,
    } = req.body;

    // Validate required fields
    if (!article_no || !product_service || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert and validate numeric values
    const numericInPrice = parseFloat(in_price);
    const numericPrice = parseFloat(price);
    const numericInStock = parseInt(in_stock || 0);

    if (isNaN(numericInPrice) || isNaN(numericPrice) || isNaN(numericInStock)) {
      return res.status(400).json({ error: "Invalid numeric values" });
    }

    const data = {
      article_no: String(article_no),
      product_service: String(product_service),
      in_price: numericInPrice,
      price: numericPrice,
      unit: unit ? String(unit) : null,
      in_stock: numericInStock,
      description: description ? String(description) : null,
    };

    const newItem = await Pricelist.create(data);
    res.status(201).json({
      success: true,
      message: "Pricelist item created successfully",
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePricelist = async (req, res, next) => {
  try {
    const {
      article_no,
      product_service,
      in_price,
      price,
      unit,
      in_stock,
      description,
    } = req.body;

    // Validate required fields
    if (!article_no || !product_service || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const data = {
      article_no,
      product_service,
      in_price: parseFloat(in_price),
      price: parseFloat(price),
      unit: unit || null,
      in_stock: in_stock || 0,
      description: description || null,
    };

    const updated = await Pricelist.update(req.validatedId, data);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Pricelist item not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Pricelist item updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePricelist = async (req, res, next) => {
  try {
    const deleted = await Pricelist.remove(req.validatedId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Pricelist item not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Pricelist item deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const createBulkPricelist = async (req, res, next) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of items",
        data: null,
      });
    }

    const processedItems = items.map((item) => ({
      article_no: String(item.article_no),
      product_service: String(item.product_service),
      in_price: parseFloat(item.in_price),
      price: parseFloat(item.price),
      unit: item.unit ? String(item.unit) : null,
      in_stock: parseInt(item.in_stock || 0),
      description: item.description ? String(item.description) : null,
    }));

    const createdItems = await Pricelist.bulkCreate(processedItems);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdItems.length} pricelist items`,
      count: createdItems.length,
      data: createdItems,
    });
  } catch (error) {
    next(error);
  }
};

export const exportToCSV = async (req, res, next) => {
  try {
    const rows = await Pricelist.getAllForExport();

    stringify(
      rows,
      {
        header: true,
        columns: {
          article_no: "Article No",
          product_service: "Product/Service",
          in_price: "In Price",
          price: "Price",
          unit: "Unit",
          in_stock: "In Stock",
          description: "Description",
        },
      },
      (err, output) => {
        if (err) throw err;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=pricelist.csv"
        );
        res.status(200).send(output);
      }
    );
  } catch (error) {
    next(error);
  }
};

export const importFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
        data: null,
      });
    }

    const fileContent = await fs.readFile(req.file.path, "utf-8");
    const records = [];

    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    for await (const record of parser) {
      records.push({
        article_no: record["Article No"],
        product_service: record["Product/Service"],
        in_price: record["In Price"],
        price: record["Price"],
        unit: record["Unit"],
        in_stock: record["In Stock"],
        description: record["Description"],
      });
    }

    const createdItems = await Pricelist.bulkCreateFromCSV(records);
    await fs.unlink(req.file.path); // Clean up uploaded file

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdItems.length} items`,
      count: createdItems.length,
      data: createdItems,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};
