# Odoo Hackathon - Quick Start Guide

## Project Structure

```
odoo-hackathon/
├── odoo_module_template/          # Odoo module template
│   ├── __init__.py
│   ├── __manifest__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── models.py              # Base and example models
│   │   └── common_models.py       # Common templates (partners, products, sales, etc.)
│   ├── data/
│   │   └── sample_data.xml        # Sample data for testing
│   └── views/
│       ├── example_model_views.xml
│       └── common_views.xml
├── odoo_client.py                 # XML-RPC/JSON-RPC client utilities
├── odoo.conf                      # Odoo server configuration
├── docker-compose.yml             # Docker setup for Odoo
└── README.md                      # This file
```

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. **Install Docker** if you haven't already:
   - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **Start Odoo with Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Access Odoo**:
   - Open browser to `http://localhost:8069`
   - Login with default credentials (or create new database)

4. **Install your module**:
   - Go to Apps menu
   - Remove 'Apps' filter
   - Search for "Hackathon Module Template"
   - Click "Install"

### Option 2: Local Installation

1. **Install Odoo**:
   ```bash
   # Clone Odoo repository
   git clone https://github.com/odoo/odoo.git
   cd odoo
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   ```

2. **Configure Odoo**:
   ```bash
   # Copy odoo.conf to your Odoo directory
   cp ../odoo.conf .
   ```

3. **Run Odoo**:
   ```bash
   python3 odoo-bin --addons-path=addons,../odoo-hackathon
   ```

4. **Access Odoo**:
   - Open browser to `http://localhost:8069`
   - Create new database or login to existing one
   - Go to Apps menu and install "Hackathon Module Template"

## Common Odoo Models Available

### Partners (res.partner)
- Customer segment classification
- Tax ID tracking
- LinkedIn profile integration

### Products (product.product)
- Brand management
- Warranty period tracking
- Environmental impact fields (carbon footprint, recyclable)

### Sales (sale.order)
- Project association
- Priority levels
- Discount policies

### Invoices (account.move)
- PO number tracking
- Late fee configuration
- Delivery date management

### Projects (project.task)
- Time tracking (estimated vs actual hours)
- Skill requirements
- Billable rate management

### HR Contracts (hr.contract)
- Probation period tracking
- Benefits management
- Remote work configuration

## XML-RPC Client Usage

```python
from odoo_client import create_odoo_client

# Create client
client = create_odoo_client(
    url='http://localhost:8069',
    db='your_database',
    username='your_username',
    password='your_password'
)

# Search and read partners
partners = client.search_read('res.partner', [], ['name', 'email'], limit=10)

# Create new record
partner_id = client.create('res.partner', {
    'name': 'New Partner',
    'email': 'partner@example.com'
})

# Update record
client.write('res.partner', [partner_id], {
    'phone': '+1-555-123-4567'
})

# Delete record
client.unlink('res.partner', [partner_id])
```

## Common Tasks for Hackathon

### 1. Create a New Module
```bash
# Copy the template and rename
cp -r odoo_module_template your_module_name
# Update __manifest__.py with your module info
```

### 2. Add New Fields to Existing Models
```python
# In your models file
from odoo import models, fields

class ResPartner(models.Model):
    _inherit = 'res.partner'
    
    your_custom_field = fields.Char(string='Your Custom Field')
```

### 3. Create New Models
```python
from odoo import models, fields

class YourModel(models.Model):
    _name = 'your.model'
    _description = 'Your Model'
    
    name = fields.Char(required=True)
    description = fields.Text()
    date = fields.Date()
```

### 4. Create Views
```xml
<!-- In your views XML file -->
<record id="view_your_model_tree" model="ir.ui.view">
    <field name="name">your.model.tree</field>
    <field name="model">your.model</field>
    <field name="arch" type="xml">
        <tree string="Your Models">
            <field name="name"/>
            <field name="description"/>
        </tree>
    </field>
</record>
```

## Troubleshooting

### Module not showing in Apps
- Update module list: Go to Apps menu → Update Apps List
- Remove 'Apps' filter

### Database connection issues
- Check Odoo server is running
- Verify database name, username, and password
- Check firewall settings

### Module installation errors
- Check Odoo logs for detailed error messages
- Ensure all dependencies are installed
- Verify Python syntax in models

## Useful Odoo Resources

- [Odoo Documentation](https://www.odoo.com/documentation)
- [Odoo Academy](https://www.odoo.com/training)
- [Odoo GitHub](https://github.com/odoo/odoo)

## Quick Commands

```bash
# Restart Docker containers
docker-compose restart

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

## Next Steps

1. Review the common models in `common_models.py`
2. Customize the templates for your specific use case
3. Add your business logic and requirements
4. Test with sample data
5. Deploy to production when ready

Good luck with your hackathon! 🚀