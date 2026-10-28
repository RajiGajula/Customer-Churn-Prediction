import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
} from "lucide-react";

import {
  getProducts,
  getProductCategories,
  createProduct,
} from "../services/productsApi";

import "../styles/Products.css";

function generateProductId() {
  return `PRD-${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`;
}

function Products() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [productAccessNotice, setProductAccessNotice] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState("");
  const [addCategoryMode, setAddCategoryMode] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [productForm, setProductForm] = useState({
    product_id: generateProductId(),
    product_category_name: "",
    product_name_lenght: "",
    product_description_lenght: "",
    product_photos_qty: "",
    product_weight_g: "",
    product_length_cm: "",
    product_height_cm: "",
    product_width_cm: "",
  });
  const [isAdmin] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const currentRole = String(
        localStorage.getItem("role") || user.role || ""
      ).toLowerCase();
      return currentRole === "admin";
    } catch {
      const currentRole = (localStorage.getItem("role") || "").toLowerCase();
      return currentRole === "admin";
    }
  });

  const limit = 20;

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-US");
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatCategory = (value) => {
    if (!value) return "Unknown";

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading products...");

      const response = await getProducts({
        search: searchQuery,
        page,
        limit,
      });

      console.log(
        "PRODUCT API RESPONSE:",
        response
      );

      /*
       * Backend response:
       *
       * {
       *   data: [...],
       *   page: 1,
       *   limit: 20,
       *   total: ...,
       *   total_pages: ...
       * }
       */

      const productList =
        Array.isArray(response)
          ? response
          : response?.data || [];

      setProducts(productList);

      setTotal(
        Number(
          response?.total ||
          productList.length ||
          0
        )
      );

      setTotalPages(
        Number(
          response?.total_pages ||
          1
        )
      );

    } catch (err) {
      console.error(
        "PRODUCT LOAD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load products."
      );

      setProducts([]);

    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, limit]);


  /* =====================================================
     LOAD CATEGORIES
  ===================================================== */

  const loadCategories = async () => {
    try {
      const response =
        await getProductCategories();

      console.log(
        "CATEGORY API RESPONSE:",
        response
      );

      const categoryList =
        Array.isArray(response)
          ? response
          : response?.data || [];

      setCategories(categoryList);

    } catch (err) {
      console.error(
        "CATEGORY LOAD ERROR:",
        err
      );

      setCategories([]);
    }
  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);


  useEffect(() => {
    loadCategories();
  }, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    try {
      setSavingProduct(true);
      setProductFormError("");
      const categoryName = addCategoryMode
        ? newCategory.trim()
        : productForm.product_category_name.trim();
      if (!categoryName) {
        setProductFormError("Choose or enter a product category.");
        return;
      }
      const product = Object.fromEntries(
        Object.entries(productForm).map(([key, value]) => [
          key,
          key === "product_id"
            ? value.trim()
            : key === "product_category_name"
              ? categoryName
            : value === "" ? null : Number(value),
        ])
      );
      await createProduct(product);
      setProductForm({
        product_id: generateProductId(),
        product_category_name: "",
        product_name_lenght: "",
        product_description_lenght: "",
        product_photos_qty: "",
        product_weight_g: "",
        product_length_cm: "",
        product_height_cm: "",
        product_width_cm: "",
      });
      setShowProductForm(false);
      setAddCategoryMode(false);
      setNewCategory("");
      setSearch("");
      setSearchQuery("");
      setPage(1);
      const refreshedProducts = await getProducts({ page: 1, limit });
      const productList = refreshedProducts?.data || [];
      setProducts(productList);
      setTotal(Number(refreshedProducts?.total) || 0);
      setTotalPages(Number(refreshedProducts?.total_pages) || 0);
      await loadCategories();
    } catch (saveError) {
      setProductFormError(saveError.message || "Unable to add product.");
    } finally {
      setSavingProduct(false);
    }
  };


  /* =====================================================
     PAGINATION
  ===================================================== */

  const firstRecord =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const lastRecord = Math.min(
    page * limit,
    total
  );


  /* =====================================================
     CATEGORY STATS
  ===================================================== */

  const totalRevenue =
    categories.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.revenue || 0
        ),
      0
    );


  const totalOrders =
    categories.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.orders || 0
        ),
      0
    );


  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="products-page">

      {/* HEADER */}

      <div className="products-page-header">

        <div className="products-title-row">

          <div className="products-title-icon">
            <Package size={24} />
          </div>

          <div>

            <h1>
              Products
            </h1>

            <p>
              Manage products and analyze
              product demand.
            </p>

          </div>

        </div>


        <div className="products-header-actions">
          <button
            className="products-refresh-button"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "products-refresh-spinning"
                  : ""
              }
            />
            Refresh
          </button>
          <button
            className="products-refresh-button"
            type="button"
            onClick={() => {
              if (!isAdmin) {
                setProductAccessNotice("Adding products is restricted to Admins. Ask an Admin to update your role in User Management.");
                return;
              }
              setProductAccessNotice("");
              setProductFormError("");
              setProductForm((form) => ({
                ...form,
                product_id: generateProductId(),
              }));
              setShowProductForm((visible) => !visible);
            }}
          >
            <Plus size={17} /> Add product
          </button>
        </div>

      </div>

      {productAccessNotice && (
        <div className="catalog-access-notice" role="status">
          {productAccessNotice}
        </div>
      )}

      {showProductForm && (
        <form className="catalog-create-card" onSubmit={handleProductSubmit}>
          <div className="products-section-header">
            <h2>Add product</h2>
            <p>New products are saved to the product catalog.</p>
          </div>
          {productFormError && <div className="catalog-form-error" role="alert">{productFormError}</div>}
          <div className="catalog-form-grid">
            <label>Product ID<input readOnly value={productForm.product_id} /></label>
            <label>Category
              {addCategoryMode ? (
                <div className="catalog-category-editor">
                  <input autoFocus required maxLength={64} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Enter a new category" />
                  <button type="button" onClick={() => { setAddCategoryMode(false); setNewCategory(""); }}>Choose existing</button>
                </div>
              ) : (
                <select
                  required
                  value={productForm.product_category_name}
                  onChange={(event) => {
                    if (event.target.value === "__add_category__") {
                      setAddCategoryMode(true);
                      setProductForm({ ...productForm, product_category_name: "" });
                    } else {
                      setProductForm({ ...productForm, product_category_name: event.target.value });
                    }
                  }}
                >
                  <option value="">Select category</option>
                  {[...new Set(categories.map((item) => item?.category).filter((category) => category && category !== "Unknown"))]
                    .sort()
                    .map((category) => <option key={category} value={category}>{formatCategory(category)}</option>)}
                  <option value="__add_category__">+ Add new category</option>
                </select>
              )}
            </label>
            <label>Photos quantity<input type="number" min="0" value={productForm.product_photos_qty} onChange={(event) => setProductForm({ ...productForm, product_photos_qty: event.target.value })} /></label>
            <label>Weight (g)<input type="number" min="0" value={productForm.product_weight_g} onChange={(event) => setProductForm({ ...productForm, product_weight_g: event.target.value })} /></label>
            <label>Length (cm)<input type="number" min="0" value={productForm.product_length_cm} onChange={(event) => setProductForm({ ...productForm, product_length_cm: event.target.value })} /></label>
            <label>Height (cm)<input type="number" min="0" value={productForm.product_height_cm} onChange={(event) => setProductForm({ ...productForm, product_height_cm: event.target.value })} /></label>
            <label>Width (cm)<input type="number" min="0" value={productForm.product_width_cm} onChange={(event) => setProductForm({ ...productForm, product_width_cm: event.target.value })} /></label>
            <label>Name length<input type="number" min="0" max="32767" value={productForm.product_name_lenght} onChange={(event) => setProductForm({ ...productForm, product_name_lenght: event.target.value })} /></label>
            <label>Description length<input type="number" min="0" max="32767" value={productForm.product_description_lenght} onChange={(event) => setProductForm({ ...productForm, product_description_lenght: event.target.value })} /></label>
          </div>
          <div className="catalog-form-actions">
            <button type="button" className="products-refresh-button" onClick={() => setShowProductForm(false)}>Cancel</button>
            <button type="submit" className="catalog-submit-button" disabled={savingProduct}>{savingProduct ? "Saving..." : "Save product"}</button>
          </div>
        </form>
      )}


      {/* SUMMARY */}

      <div className="products-summary">

        <div className="products-summary-card">

          <div className="products-summary-icon purple">
            <Package size={21} />
          </div>

          <div>

            <span>
              Total Products
            </span>

            <strong>
              {formatNumber(total)}
            </strong>

          </div>

        </div>


        <div className="products-summary-card">

          <div className="products-summary-icon blue">
            <Package size={21} />
          </div>

          <div>

            <span>
              Categories
            </span>

            <strong>
              {formatNumber(
                categories.length
              )}
            </strong>

          </div>

        </div>


        <div className="products-summary-card">

          <div className="products-summary-icon green">
            <span className="products-dollar">
              $
            </span>
          </div>

          <div>

            <span>
              Product Revenue
            </span>

            <strong>
              {formatCurrency(
                totalRevenue
              )}
            </strong>

          </div>

        </div>


        <div className="products-summary-card">

          <div className="products-summary-icon orange">
            #
          </div>

          <div>

            <span>
              Product Orders
            </span>

            <strong>
              {formatNumber(
                totalOrders
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* CATEGORY SECTION */}

      <div className="products-category-card">

        <div className="products-section-header">

          <h2>
            Product Categories
          </h2>

          <p>
            Product demand and revenue
            by category.
          </p>

        </div>


        {categories.length === 0 ? (

          <div className="products-no-category">
            No category data available.
          </div>

        ) : (

          <div className="category-grid">

            {categories
              .slice(0, 8)
              .map((category, index) => (

                <div
                  className="category-card"
                  key={
                    category?.category ||
                    index
                  }
                >

                  <div className="category-top">

                    <div className="category-icon">
                      <Package size={18} />
                    </div>

                    <span>
                      {formatCategory(
                        category?.category
                      )}
                    </span>

                  </div>


                  <div className="category-stats">

                    <div>

                      <small>
                        Orders
                      </small>

                      <strong>
                        {formatNumber(
                          category?.orders
                        )}
                      </strong>

                    </div>


                    <div>

                      <small>
                        Revenue
                      </small>

                      <strong>
                        {formatCurrency(
                          category?.revenue
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

              ))}

          </div>

        )}

      </div>


      {/* SEARCH */}

      <div className="products-filter-card">

        <form
          className="products-search"
          onSubmit={handleSearch}
        >

          <Search size={19} />

          <input
            type="text"
            placeholder="Search product ID or category..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button type="submit">
            Search
          </button>

        </form>

      </div>


      {/* ERROR */}

      {error && (

        <div className="products-error">

          <span>
            {error}
          </span>

          <button
            onClick={loadProducts}
          >
            Try Again
          </button>

        </div>

      )}


      {/* TABLE */}

      <div className="products-table-card">

        {loading ? (

          <div className="products-loading">

            <div className="products-spinner"></div>

            <p>
              Loading products...
            </p>

          </div>

        ) : products.length === 0 ? (

          <div className="products-empty">

            <Package size={42} />

            <h3>
              No products found
            </h3>

            <p>
              No product records
              were returned.
            </p>

          </div>

        ) : (

          <>

            <div className="products-table-wrapper">

              <table className="products-table">

                <thead>

                  <tr>

                    <th>
                      Product ID
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Orders
                    </th>

                    <th>
                      Revenue
                    </th>

                    <th>
                      Photos
                    </th>

                    <th>
                      Weight
                    </th>

                    <th>
                      Dimensions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {products.map(
                    (product, index) => (

                      <tr
                        key={
                          product?.product_id ||
                          index
                        }
                      >

                        <td>

                          <span className="product-id">
                            {product?.product_id ||
                              "—"}
                          </span>
                          {product?.created_at && <span className="catalog-new-badge">New</span>}

                        </td>


                        <td>

                          <span className="product-category">
                            {formatCategory(
                              product?.product_category_name
                            )}
                          </span>

                        </td>


                        <td>

                          <strong>
                            {formatNumber(
                              product?.order_count
                            )}
                          </strong>

                        </td>


                        <td>

                          <strong className="product-revenue">
                            {formatCurrency(
                              product?.revenue
                            )}
                          </strong>

                        </td>


                        <td>
                          {formatNumber(
                            product?.product_photos_qty
                          )}
                        </td>


                        <td>

                          {product?.product_weight_g
                            ? `${formatNumber(
                                product.product_weight_g
                              )} g`
                            : "—"}

                        </td>


                        <td>

                          {product?.product_length_cm &&
                          product?.product_height_cm &&
                          product?.product_width_cm
                            ? `${product.product_length_cm} × ${product.product_height_cm} × ${product.product_width_cm} cm`
                            : "—"}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* PAGINATION */}

            <div className="products-pagination">

              <span>

                Showing {firstRecord}–
                {lastRecord} of{" "}
                {formatNumber(total)}

              </span>


              <div className="products-pagination-controls">

                <button
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                >

                  <ChevronLeft
                    size={17}
                  />

                </button>


                <span>

                  Page {page}

                  {totalPages
                    ? ` of ${totalPages}`
                    : ""}

                </span>


                <button
                  disabled={
                    totalPages > 0 &&
                    page >=
                      totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                >

                  <ChevronRight
                    size={17}
                  />

                </button>

              </div>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

export default Products;