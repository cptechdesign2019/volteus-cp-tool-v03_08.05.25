/**
 * Customer CSV Parser Utility
 * Handles CSV parsing, validation, and error reporting for customer imports
 */

import Papa from 'papaparse';

// Required CSV columns mapping to database fields - very permissive
const REQUIRED_COLUMNS = [
  // No required columns - accept any CSV format
];

// Column mapping for both residential and commercial customers
const COLUMN_MAPPING = {
  // Basic customer information - Commercial format
  'company_name': 'company_name', // Direct match for snake_case
  'Company Name': 'company_name',
  'Name': 'company_name', // For commercial fallback and residential primary
  'customer_type': 'customer_type', // Direct match for snake_case
  'Customer Type': 'customer_type',
  'Type': 'customer_type', // Alternative
  
  // Contact information (primary contact)
  'Contact Name': 'primary_contact_name',
  'Primary Contact': 'primary_contact_name',
  'Contact Email': 'primary_contact_email',
  'Email': 'primary_contact_email', // Alternative
  'Contact Number': 'primary_contact_phone',
  'Phone': 'primary_contact_phone', // Alternative
  'Contact Phone': 'primary_contact_phone', // Alternative
  'Role': 'primary_contact_role',
  'Contact Role': 'primary_contact_role',
  'Title': 'primary_contact_role',
  
  // Address information (full address in your format)
  'billing_address': 'full_address', // Direct match for snake_case
  'service_address': 'service_full_address', // Direct match for snake_case
  'Address': 'full_address', // Your CSV has complete address in one field
  'Street': 'billing_street',
  'Billing Street': 'billing_street',
  'City': 'billing_city',
  'Billing City': 'billing_city',
  'State': 'billing_state',
  'Billing State': 'billing_state',
  'Zip': 'billing_zip',
  'Billing Zip': 'billing_zip',
  'ZIP Code': 'billing_zip',
  'Country': 'billing_country',
  'Billing Country': 'billing_country',
  
  // Service address (if different)
  'Service Street': 'service_street',
  'Service Address': 'service_street',
  'Service City': 'service_city',
  'Service State': 'service_state',
  'Service Zip': 'service_zip',
  'Service Country': 'service_country',
  
  // Additional information
  'account_notes': 'account_notes', // Direct match for snake_case
  'Notes': 'account_notes',
  'Customer Notes': 'account_notes', // For residential format
  'Account Notes': 'account_notes',
  'Comments': 'account_notes',
  'Customer Status': 'customer_status', // For commercial format
  'Date Added': 'date_added',
  'Tags': 'tags'
};

// Field validation constraints - very permissive to accept data as-is
const FIELD_CONSTRAINTS = {
  company_name: { required: false, maxLength: 500 }, // Company name - will be derived if missing
  customer_type: { required: false }, // Customer type - will be auto-detected
  primary_contact: { required: false, type: 'object' }, // Primary contact object - optional
  billing_address: { required: false, type: 'object' },
  service_address: { required: false, type: 'object' },
  account_notes: { required: false, maxLength: 5000 }, // Increased limit
  customer_status: { required: false, maxLength: 200 },
  date_added: { required: false },
  tags: { required: false, type: 'array' }
};

/**
 * Parse customer CSV content and validate structure and data
 * @param {string} csvContent - Raw CSV content
 * @param {string} customerType - Expected customer type ('Residential' or 'Commercial')
 * @returns {Object} - { success: boolean, data: Array, errors: Array, summary: Object }
 */
export function parseCustomerCSV(csvContent, customerType = null) {
  const errors = [];
  
  // Check for empty content
  if (!csvContent || csvContent.trim() === '') {
    return {
      success: false,
      data: [],
      errors: ['CSV file is empty'],
      summary: null
    };
  }

  // Remove BOM if present
  const cleanContent = csvContent.replace(/^\uFEFF/, '');

  // Parse with Papa Parse
  const parseResult = Papa.parse(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value ? value.trim() : '',
    complete: function(results) {
      console.log('Papa Parse complete:', results);
    },
    error: function(error) {
      console.error('Papa Parse error:', error);
    }
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    const criticalErrors = parseResult.errors.filter(error => 
      error.type === 'Delimiter' || error.type === 'Quotes'
    );
    
    if (criticalErrors.length > 0) {
      return {
        success: false,
        data: [],
        errors: criticalErrors.map(error => `Row ${error.row || 'unknown'}: ${error.message}`),
        summary: null
      };
    }
  }

  // Check if we have data
  if (!parseResult.data || parseResult.data.length === 0) {
    return {
      success: false,
      data: [],
      errors: ['No data found in CSV file'],
      summary: null
    };
  }

  // Get headers from the first row
  const headers = Object.keys(parseResult.data[0] || {});
  console.log('CSV headers found:', headers);

  // Process and validate each row
  const processedData = [];
  const validationErrors = [];
  const warnings = [];
  let skippedRows = 0;

  parseResult.data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Skip completely empty rows
    if (Object.values(row).every(value => !value || value.trim() === '')) {
      skippedRows++;
      return;
    }

    try {
      const processedRow = processCSVRow(row, headers, customerType);
      
      if (processedRow.errors.length > 0) {
        processedRow.errors.forEach(error => {
          validationErrors.push(`Row ${rowNumber}: ${error}`);
        });
      }
      
      if (processedRow.warnings.length > 0) {
        processedRow.warnings.forEach(warning => {
          warnings.push(`Row ${rowNumber}: ${warning}`);
        });
      }

      // Only include row if it has at least a company name or contact name
      if (processedRow.data.company_name || processedRow.data.primary_contact?.contact_name) {
        processedData.push({
          ...processedRow.data,
          _sourceRow: rowNumber,
          _originalData: row
        });
      } else {
        validationErrors.push(`Row ${rowNumber}: No company name or contact name found`);
      }
    } catch (error) {
      validationErrors.push(`Row ${rowNumber}: Error processing row - ${error.message}`);
    }
  });

  // Create summary
  const summary = createImportSummary(processedData, validationErrors, warnings, skippedRows, customerType);

  // Determine success
  const hasData = processedData.length > 0;
  const hasCriticalErrors = validationErrors.length > processedData.length;

  return {
    success: hasData && !hasCriticalErrors,
    data: processedData,
    errors: validationErrors,
    warnings: warnings,
    summary: summary
  };
}

/**
 * Process a single CSV row into our customer format
 */
function processCSVRow(row, headers, expectedCustomerType) {
  const errors = [];
  const warnings = [];
  const processedData = {
    // Default structure
    company_name: '',
    customer_type: expectedCustomerType || 'Commercial', // Default to Commercial
    primary_contact: null,
    billing_address: {},
    service_address: {},
    account_notes: '',
    tags: [],
    customer_status: '',
    date_added: null
  };

  // Map CSV columns to our fields
  const mappedData = mapCSVColumns(row, headers);
  
  // Process company name - very flexible
  processedData.company_name = mappedData.company_name || 
                               mappedData.primary_contact_name || 
                               'Unknown Company';
  
  // Auto-detect customer type if not specified
  if (!expectedCustomerType) {
    processedData.customer_type = detectCustomerType(processedData.company_name, mappedData);
  }

  // Process primary contact
  if (mappedData.primary_contact_name || mappedData.primary_contact_email || mappedData.primary_contact_phone) {
    processedData.primary_contact = {
      contact_name: mappedData.primary_contact_name || 'Unknown Contact',
      email: cleanEmail(mappedData.primary_contact_email),
      phone: cleanPhone(mappedData.primary_contact_phone),
      role: mappedData.primary_contact_role || 'Primary Contact',
      is_primary_contact: true,
      contact_notes: null
    };

    // Validate email if provided
    if (processedData.primary_contact.email && !isValidEmail(processedData.primary_contact.email)) {
      warnings.push(`Invalid email format: ${processedData.primary_contact.email}`);
      processedData.primary_contact.email = null;
    }
  }

  // Process addresses - handle both structured data and JSON strings
  if (mappedData.full_address) {
    // Try to parse as JSON first (if it's already a JSON object from CSV)
    try {
      const parsed = typeof mappedData.full_address === 'string' 
        ? JSON.parse(mappedData.full_address) 
        : mappedData.full_address;
      processedData.billing_address = parsed;
    } catch (e) {
      // If not JSON, treat as street address
      processedData.billing_address = buildAddress({
        street: mappedData.full_address,
        city: mappedData.billing_city,
        state: mappedData.billing_state,
        zip_code: mappedData.billing_zip,
        country: mappedData.billing_country || 'USA'
      });
    }
  } else {
    // Build from individual fields
    processedData.billing_address = buildAddress({
      street: mappedData.billing_street,
      city: mappedData.billing_city,
      state: mappedData.billing_state,
      zip_code: mappedData.billing_zip,
      country: mappedData.billing_country || 'USA'
    });
  }

  // Handle service address
  if (mappedData.service_full_address) {
    try {
      const parsed = typeof mappedData.service_full_address === 'string' 
        ? JSON.parse(mappedData.service_full_address) 
        : mappedData.service_full_address;
      processedData.service_address = parsed;
    } catch (e) {
      processedData.service_address = buildAddress({
        street: mappedData.service_full_address,
        country: 'USA'
      });
    }
  } else {
    processedData.service_address = buildAddress({
      street: mappedData.service_street,
      city: mappedData.service_city,
      state: mappedData.service_state,
      zip_code: mappedData.service_zip,
      country: mappedData.service_country
    });
  }

  // If no service address, copy from billing
  if (isEmptyAddress(processedData.service_address) && !isEmptyAddress(processedData.billing_address)) {
    processedData.service_address = { ...processedData.billing_address };
  }

  // Process other fields
  processedData.account_notes = mappedData.account_notes || '';
  processedData.customer_status = mappedData.customer_status || 'Active';
  
  // Process tags
  if (mappedData.tags) {
    processedData.tags = parseTagsField(mappedData.tags);
  }

  // Process date
  if (mappedData.date_added) {
    const parsedDate = parseDate(mappedData.date_added);
    if (parsedDate) {
      processedData.date_added = parsedDate;
    } else {
      warnings.push(`Invalid date format: ${mappedData.date_added}`);
    }
  }

  return {
    data: processedData,
    errors,
    warnings
  };
}

/**
 * Map CSV columns to our internal field names
 */
function mapCSVColumns(row, headers) {
  const mapped = {};
  
  // Create case-insensitive mapping
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[lowerHeaders[index]] = header;
  });

  // Map each column
  Object.entries(COLUMN_MAPPING).forEach(([csvColumn, internalField]) => {
    const lowerCsvColumn = csvColumn.toLowerCase();
    const matchingHeader = headerMap[lowerCsvColumn];
    
    if (matchingHeader && row[matchingHeader]) {
      mapped[internalField] = row[matchingHeader];
    }
  });

  // Fallback mappings for common variations
  if (!mapped.company_name) {
    // Try common company name variations
    const companyFields = ['company', 'business', 'organization', 'client', 'customer'];
    for (const field of companyFields) {
      const header = findHeaderContaining(headers, field);
      if (header && row[header]) {
        mapped.company_name = row[header];
        break;
      }
    }
  }

  if (!mapped.primary_contact_name) {
    // Try common contact name variations
    const nameFields = ['name', 'contact', 'person', 'representative'];
    for (const field of nameFields) {
      const header = findHeaderContaining(headers, field);
      if (header && row[header] && header.toLowerCase() !== headerMap['company']) {
        mapped.primary_contact_name = row[header];
        break;
      }
    }
  }

  return mapped;
}

/**
 * Helper functions
 */
function findHeaderContaining(headers, searchTerm) {
  return headers.find(header => 
    header.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

function detectCustomerType(companyName, mappedData) {
  const residentialKeywords = ['residence', 'home', 'house', 'family', 'personal'];
  const commercialKeywords = ['llc', 'inc', 'corp', 'company', 'business', 'enterprise'];
  
  const nameToCheck = (companyName || '').toLowerCase();
  
  if (residentialKeywords.some(keyword => nameToCheck.includes(keyword))) {
    return 'Residential';
  }
  
  if (commercialKeywords.some(keyword => nameToCheck.includes(keyword))) {
    return 'Commercial';
  }
  
  // Default to Commercial for business contexts
  return 'Commercial';
}

function cleanEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

function cleanPhone(phone) {
  if (!phone) return null;
  // Remove all non-numeric characters except + for international
  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function buildAddress(addressData) {
  const address = {};
  
  if (addressData.street) address.street = addressData.street;
  if (addressData.city) address.city = addressData.city;
  if (addressData.state) address.state = addressData.state;
  if (addressData.zip_code) address.zip_code = addressData.zip_code;
  if (addressData.country) address.country = addressData.country;
  
  return address;
}

function isEmptyAddress(address) {
  return !address || Object.keys(address).length === 0 || 
         Object.values(address).every(value => !value || value.trim() === '');
}

function parseTagsField(tagsString) {
  if (!tagsString) return [];
  
  // Split by common delimiters and clean up
  return tagsString
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

function parseDate(dateString) {
  if (!dateString) return null;
  
  // Try various date formats
  const date = new Date(dateString);
  
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  return null;
}

function createImportSummary(data, errors, warnings, skippedRows, customerType) {
  const totalCustomers = data.length;
  const residentialCount = data.filter(c => c.customer_type === 'Residential').length;
  const commercialCount = data.filter(c => c.customer_type === 'Commercial').length;
  const withContacts = data.filter(c => c.primary_contact).length;
  const withAddresses = data.filter(c => !isEmptyAddress(c.billing_address)).length;

  return {
    totalRows: data.length + errors.length + skippedRows,
    successfulImports: totalCustomers,
    errors: errors.length,
    warnings: warnings.length,
    skippedRows,
    customerBreakdown: {
      total: totalCustomers,
      residential: residentialCount,
      commercial: commercialCount
    },
    dataQuality: {
      withContacts,
      withAddresses,
      contactPercentage: totalCustomers > 0 ? Math.round((withContacts / totalCustomers) * 100) : 0,
      addressPercentage: totalCustomers > 0 ? Math.round((withAddresses / totalCustomers) * 100) : 0
    },
    detectedCustomerType: customerType || 'Mixed'
  };
}