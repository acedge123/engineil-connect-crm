
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

    // Parse the header line - handle both quoted and unquoted CSV
    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    console.log('CSV Headers found:', headers);

    // Map the Shopify customer CSV headers based on the format provided
    const headerMap: { [key: string]: string } = {
      'customer id': 'customer_id',
      'first name': 'first_name', 
      'last name': 'last_name',
      'email': 'email',
      'accepts email marketing': 'accepts_email_marketing',
      'default address company': 'company',
      'default address address1': 'address1',
      'default address address2': 'address2', 
      'default address city': 'city',
      'default address province code': 'province_code',
      'default address country code': 'country_code',
      'default address zip': 'zip',
      'default address phone': 'default_phone',
      'phone': 'phone',
      'accepts sms marketing': 'accepts_sms_marketing',
      'total spent': 'total_spent',
      'total orders': 'total_orders',
      'note': 'note',
      'tax exempt': 'tax_exempt',
      'tags': 'tags'
    };

    // Check if we have required Shopify headers
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
      // Handle tab-separated values (Shopify format)
      const values = lines[i].split('\t').map(v => v.trim().replace(/['"]/g, ''));
      
      let customerData: Partial<ParsedCustomerData> = {};
      let firstName = '';
      let lastName = '';
      
      headers.forEach((header, index) => {
        const value = values[index];
        const normalizedHeader = header.toLowerCase().trim();
        
        if (value && value.trim()) {
          switch (normalizedHeader) {
            case 'email':
              customerData.customer_email = value;
              break;
            case 'first name':
              firstName = value;
              break;
            case 'last name':
              lastName = value;
              break;
            case 'customer id':
              customerData.order_id = value;
              break;
            case 'total spent':
              // Parse the total spent value, removing any currency symbols
              const totalSpent = parseFloat(value.replace(/[$,]/g, ''));
              if (!isNaN(totalSpent)) {
                customerData.order_total = totalSpent;
              }
              break;
          }
        }
      });

      // Combine first and last name
      if (firstName || lastName) {
        customerData.customer_name = [firstName, lastName].filter(Boolean).join(' ');
      }

      // Create the customer record if we have the required email
      if (customerData.customer_email) {
        // Use customer ID as order ID, or generate one
        if (!customerData.order_id) {
          customerData.order_id = `CUST-${Date.now()}-${i}`;
        }
        
        // Default to 0 if no total spent found
        if (!customerData.order_total) {
          customerData.order_total = 0;
        }
        
        // Set current date as order date for customer data
        if (!customerData.order_date) {
          customerData.order_date = new Date().toISOString().split('T')[0];
        }
        
        parsedData.push(customerData as ParsedCustomerData);
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
