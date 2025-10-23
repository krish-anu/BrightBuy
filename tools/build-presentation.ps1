param(
  [string]$Output = "BrightBuy-Presentation.pptx"
)

function Add-BulletSlide {
  param(
    [Parameter(Mandatory)] [object]$Presentation,
    [Parameter(Mandatory)] [string]$Title,
    [string[]]$Bullets = @()
  )
  # 2 = ppLayoutTitleAndText
  $slide = $Presentation.Slides.Add($Presentation.Slides.Count + 1, 2)
  $slide.Shapes.Title.TextFrame.TextRange.Text = $Title
  $textBox = $slide.Shapes.Item(2)
  if ($Bullets -and $Bullets.Count -gt 0) {
    $text = ($Bullets -join "`r")
    $rng = $textBox.TextFrame.TextRange
    $rng.Text = $text
    $rng.ParagraphFormat.Bullet.Visible = $true
  } else {
    $textBox.TextFrame.TextRange.Text = ""
  }
  return $slide
}

# Ensure absolute output path
if (-not([System.IO.Path]::IsPathRooted($Output))) {
  $Output = Join-Path -Path (Get-Location) -ChildPath $Output
}

# Create PowerPoint and presentation
$pp = $null
try {
  $pp = New-Object -ComObject PowerPoint.Application
  $pp.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
} catch {
  Write-Error "Failed to start PowerPoint. Make sure Microsoft PowerPoint is installed. $_"
  exit 1
}

$pres = $pp.Presentations.Add()

# Slides content (base)
Add-BulletSlide -Presentation $pres -Title "BrightBuy: Retail Inventory and Order Management" -Bullets @(
  "Full-stack system: Node.js/Express, React+Vite, MySQL 8",
  "Containerized with Docker Compose",
  "Key features: Auth, RBAC, Inventory, Orders, Payments, S3, Reports"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Problem Scenario" -Bullets @(
  "Manual inventory causes stock inaccuracies",
  "Fragmented order and delivery coordination",
  "Limited visibility into sales and KPIs",
  "Media storage scattered; online payments complex"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Solution Overview" -Bullets @(
  "Centralized catalog, variants, and inventory",
  "End-to-end orders, deliveries, and payments",
  "Role-based workflows and secure access",
  "Cloud storage and actionable analytics"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Tech Stack and Architecture" -Bullets @(
  "Backend: Node.js + Express + mysql2 (prepared statements)",
  "Frontend: React + Vite + Tailwind",
  "Database: MySQL 8 (procedures, triggers, constraints)",
  "Integrations: Stripe (payments), AWS S3 (storage)"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Core Functionalities" -Bullets @(
  "Authentication with JWT (10-min tokens)",
  "Product catalog, variants, attributes, categories",
  "Inventory management with stock checks and backorders",
  "Order lifecycle: create, ship, deliver, cancel"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Payments and Storage" -Bullets @(
  "Stripe Checkout for card payments",
  "Webhook updates order/payment state securely",
  "Cash-on-Delivery supported with delivery confirmation",
  "AWS S3 for image uploads via SDK v3"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Role-Based Access (RBAC)" -Bullets @(
  "JWT verification and role middleware (backend)",
  "Frontend protected routes and role-aware UI",
  "Roles: SuperAdmin, Admin, WarehouseStaff, DeliveryStaff, Customer"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Roles and Responsibilities" -Bullets @(
  "SuperAdmin: full access, user approvals, reports",
  "Admin: inventory, orders, reporting",
  "WarehouseStaff: inventory operations, fulfillment",
  "DeliveryStaff: assigned deliveries, status updates",
  "Customer: browse, order, track"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Reports and Analytics" -Bullets @(
  "KPIs: total revenue, total orders, top product",
  "Charts: status overview, category distribution, quarterly sales",
  "Tables: customer-wise summary, upcoming deliveries",
  "Resilient services for consistent UI"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Database Logic and Safety" -Bullets @(
  "Prepared queries reduce SQL injection risk",
  "Stored function for order totals",
  "Procedures: create order, add item, create payment",
  "Triggers: line totals, total sync, non-negative stock",
  "Constraints and indexes for integrity and performance"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "2FA (Planned Enhancement)" -Bullets @(
  "Not implemented currently; proposal included",
  "Option 1: TOTP via authenticator app",
  "Option 2: Email/SMS OTP",
  "Extend auth flow and DB with 2FA fields"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Demo Flow" -Bullets @(
  "Register/Login -> Role-based dashboard",
  "Add to cart -> Create order",
  "Stripe checkout -> Webhook -> Confirmed",
  "Delivery assignment -> Shipped -> Delivered",
  "Review analytics in Reports"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Roadmap" -Bullets @(
  "2FA rollout and session hardening",
  "Audit logs and rate-limiting",
  "Secrets management and CI/CD",
  "Enhanced product media workflows"
) | Out-Null

# Additional detail slides (ASCII only)
Add-BulletSlide -Presentation $pres -Title "Problem Scenario - Details" -Bullets @(
  "Stock inaccuracies from manual updates (over or under selling)",
  "Slow coordination between warehouse and delivery staff",
  "Disconnected views of orders, payments, deliveries",
  "Image and file sprawl across machines and emails",
  "Online card payments require compliant and robust integrations"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Solution Architecture - Details" -Bullets @(
  "API-first backend: REST endpoints under /api/*",
  "Prepared statements via mysql2 to mitigate SQL injection",
  "DB enforces business rules with procedures and triggers",
  "Frontend guards (PrivateRoute) and role-aware navigation",
  "Stripe webhooks keep payment state in sync",
  "S3 used for durable, scalable media storage"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Core Functionalities - Details" -Bullets @(
  "Catalog: products, variants, attributes, categories",
  "Inventory: stock counts, backorder handling, restocking",
  "Orders: address capture, delivery creation, status flow",
  "Payments: Card (Stripe Checkout) and Cash-on-Delivery",
  "Deliveries: assignment, shipped/delivered updates",
  "Reporting: revenue, order volume, top products, customers"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Payments - Details" -Bullets @(
  "Checkout Session per order; items mapped to Stripe line_items",
  "Success/Cancel handlers reconcile order and payment",
  "Webhook verifies signature (STRIPE_WEBHOOK_SECRET)",
  "Statuses: Pending -> Paid/Failed/Cancelled",
  "COD path: delivery staff can confirm payment on delivery"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "RBAC - Details" -Bullets @(
  "JWT contains user id and role; verified per request",
  "Role middleware authorizes per-route access",
  "Admin/SuperAdmin only: reports, global orders",
  "DeliveryStaff: assigned deliveries; Warehouse: fulfillment",
  "Customer: own orders only; protected on server and client"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Roles - Responsibilities (Deep Dive)" -Bullets @(
  "SuperAdmin: approve staff roles, full visibility",
  "Admin: manage inventory, orders, reporting dashboards",
  "WarehouseStaff: maintain stock, prepare shipments",
  "DeliveryStaff: update delivery status, process COD",
  "Customer: manage profile, place and track orders"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Reports - Data Sources" -Bullets @(
  "Total revenue and orders from aggregated endpoints",
  "Order status overview computed from order states",
  "Top products by item quantities (period filters)",
  "Customer summaries: count, spend, last order, payment status",
  "Upcoming deliveries: ETA from order dates and statuses"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Database Objects - Details" -Bullets @(
  "Function: fn_calculate_order_total(orderId)",
  "Procedures: sp_create_order, sp_add_order_item, sp_create_payment",
  "Triggers: totals sync; non-negative stock enforcement",
  "Constraints: FKs, unique keys; CHECKs for domain rules",
  "Indexes: performance on common filters and joins"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Security and Hardening" -Bullets @(
  "JWT short expiry, role gating, server-side authorization",
  "Parameterized SQL throughout (mysql2 execute)",
  "Webhook raw body and signature validation for Stripe",
  "Least-privilege IAM for S3; object key namespaced by entity",
  "Planned: 2FA, rate-limiting, audit logging, secret rotation"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Stripe Flow - Sequence" -Bullets @(
  "Create order -> Build Checkout Session",
  "Customer pays -> Stripe redirects back",
  "Webhook fires -> verify -> mark Paid/Confirmed",
  "On failure/expire -> mark Failed/Cancelled -> restock",
  "COD branch bypasses Stripe and confirms on delivery"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "AWS S3 Flow - Sequence" -Bullets @(
  "Client uploads via backend endpoint (multipart/form-data)",
  "Server builds key: entity/entityId/timestamp_random.ext",
  "PutObjectCommand to S3 bucket with content type",
  "Return public URL for frontend use",
  "Future: lifecycle, thumbnails, presigned URLs for direct upload"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "2FA - Implementation Plan" -Bullets @(
  "DB fields: users.totpSecret, users.is2FAEnabled",
  "Enrollment endpoint returns QR (TOTP secret)",
  "Login: password -> TOTP verification -> issue JWT",
  "Fallback: email/SMS OTP with expiry and rate limits",
  "Frontend: add 2FA screens; recovery codes (optional)"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Demo Data - Notes" -Bullets @(
  "Seeded products (50) and variants (60) for realistic UI",
  "Sample users across roles (Admin, Delivery, Customers)",
  "Sample orders, items, deliveries, payments",
  "Safe to re-seed for demos; idempotent inserts",
  "Constraints script adds FKs, indexes, and checks"
) | Out-Null

# New: AWS EC2 deployment slides
Add-BulletSlide -Presentation $pres -Title "AWS EC2 Deployment - Overview" -Bullets @(
  "EC2 (Ubuntu) hosts backend API and frontend",
  "Reverse proxy with Nginx; SSL via Certbot (Lets Encrypt)",
  "Process manager: PM2 or Docker Compose for services",
  "Environment variables from .env (no secrets in code)",
  "Security Groups: allow 80/443; restrict 22 (SSH)"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "AWS EC2 Deployment - Steps" -Bullets @(
  "Provision EC2; attach Elastic IP; configure Security Groups",
  "Install Node.js/Docker; pull repo; set .env",
  "Build frontend (Vite) and serve via Nginx",
  "Run backend (PM2 or docker-compose.prod.yml)",
  "Enable HTTPS with Certbot; set up CI/CD (GitHub Actions)"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "CI/CD - GitHub Actions" -Bullets @(
  "Triggers: on push/pull_request to main",
  "Jobs: build and test backend (Node) and frontend (Vite)",
  "Artifacts: upload production build for frontend",
  "Docker: build and push images to registry (optional)",
  "Deploy: SSH to EC2 or use runner on server to pull and restart",
  "Secrets: API keys and .env via GitHub Secrets"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Database Normalization" -Bullets @(
  "3NF target: each attribute depends on the key, the whole key, and nothing but the key",
  "Separate entities: users, products, variants, orders, order_items, payments, deliveries",
  "Remove repeating groups and multivalued fields (e.g., variant attributes in child tables)",
  "Use foreign keys for relationships; avoid data duplication",
  "Benefits: integrity, smaller updates, clearer query patterns"
) | Out-Null

Add-BulletSlide -Presentation $pres -Title "Indexing Strategy" -Bullets @(
  "Composite indexes on frequent filters/joins (e.g., orders(userId,status), order_items(orderId,variantId))",
  "Prefix most-selective columns first; cover queries where practical",
  "Add indexes for foreign keys and search fields (e.g., products(name), variants(sku))",
  "Avoid over-indexing: write overhead and storage costs",
  "Monitor with EXPLAIN and adjust based on real workload"
) | Out-Null

# Save and close
try {
  $pres.SaveAs($Output)
  Write-Host "Presentation created:" $Output
} catch {
  Write-Error "Failed to save presentation to '$Output'. $_"
  $pres.Close()
  $pp.Quit()
  exit 1
}

$pres.Close()
$pp.Quit()
