export type ParsedCustomerData = {
  customer_email: string;
  customer_name?: string;
  order_id: string;
  order_total: number;
  order_date: string;
};

export type CSVParseResult = {
  success: boolean;
  data: ParsedCustomerData[];
  error?: string;
};

export const parseShopifyCustomerCSV = (csvContent: string): CSVParseResult => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        error: 'CSV file must contain at least a header and one data row'
      };
    }

    // Parse the header line - handle both quoted and unquoted CSV, including tab-separated
    const headerLine = lines[0];
    let headers: string[];
    
    // Check if it's tab-separated (Shopify export format)
    if (headerLine.includes('\t')) {
      headers = headerLine.split('\t').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    } else {
      // Handle comma-separated with potential quoted values
      headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    }
    
    console.log('CSV Headers found:', headers);

    // Check for Shopify customer export headers
    const requiredShopifyHeaders = ['email'];
    const hasRequiredHeaders = requiredShopifyHeaders.some(header => 
      headers.includes(header.toLowerCase())
    );
    
    if (!hasRequiredHeaders) {
      return {
        success: false,
        data: [],
        error: 'CSV must contain at least an "Email" column for Shopify customer data'
      };
    }

    const parsedData: ParsedCustomerData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle both tab-separated and comma-separated values
      let values: string[];
      if (headerLine.includes('\t')) {
        values = line.split('\t').map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      }
      
      let customerData: Partial<ParsedCustomerData> = {};
      let firstName = '';
      let lastName = '';
      
      headers.forEach((header, index) => {
        const value = values[index];
        const normalizedHeader = header.toLowerCase().trim();
        
        if (value && value.trim()) {
          switch (normalizedHeader) {
            case 'email':
              customerData.customer_email = value.trim();
              break;
            case 'first name':
              firstName = value.trim();
              break;
            case 'last name':
              lastName = value.trim();
              break;
            case 'customer id':
              // Use Customer ID as the order ID since this is customer data, not order data
              customerData.order_id = value.trim();
              break;
            case 'total spent':
              // Parse the total spent value, removing any currency symbols
              const cleanValue = value.replace(/[$,]/g, '').trim();
              const totalSpent = parseFloat(cleanValue);
              
              if (!isNaN(totalSpent) && totalSpent >= 0 && totalSpent < 1000000) {
                customerData.order_total = totalSpent;
              } else {
                console.log(`Invalid total spent value for ${customerData.customer_email}: ${value} -> ${totalSpent}, defaulting to 0`);
                customerData.order_total = 0;
              }
              break;
            case 'total orders':
              // We could use this for validation but we'll keep it simple for now
              break;
          }
        }
      });

      // Combine first and last name
      if (firstName || lastName) {
        customerData.customer_name = [firstName, lastName].filter(Boolean).join(' ');
      }

      // Create the customer record if we have the required email
      if (customerData.customer_email && customerData.customer_email.trim()) {
        // Generate a unique order ID if we don't have a customer ID
        if (!customerData.order_id) {
          customerData.order_id = `CUSTOMER-${Date.now()}-${i}`;
        }
        
        // Default to 0 if no total spent found
        if (customerData.order_total === undefined) {
          customerData.order_total = 0;
        }
        
        // Set empty order date since this is customer lifetime data, not specific orders
        customerData.order_date = '';
        
        parsedData.push(customerData as ParsedCustomerData);
        
        console.log(`Parsed customer: ${customerData.customer_email} - $${customerData.order_total}`);
      }
    }

    if (parsedData.length === 0) {
      return {
        success: false,
        data: [],
        error: 'No valid customer data found in CSV'
      };
    }

    console.log(`Successfully parsed ${parsedData.length} customer records`);
    console.log('Sample parsed data:', parsedData.slice(0, 3));

    return {
      success: true,
      data: parsedData
    };
  } catch (error) {
    console.error('CSV parsing error:', error);
    return {
      success: false,
      data: [],
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
