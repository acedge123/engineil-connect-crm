
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

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    console.log('CSV Headers found:', headers);

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
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const customerData: Partial<ParsedCustomerData> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value.trim()) {
          switch (header) {
            case 'email':
              customerData.customer_email = value;
              break;
            case 'first name':
              customerData.customer_name = value;
              break;
            case 'last name':
              if (customerData.customer_name) {
                customerData.customer_name += ` ${value}`;
              } else {
                customerData.customer_name = value;
              }
              break;
            case 'customer id':
              customerData.order_id = value;
              break;
            case 'total spent':
              const totalSpent = parseFloat(value.replace(/[$,]/g, ''));
              if (!isNaN(totalSpent)) {
                customerData.order_total = totalSpent;
              }
              break;
          }
        }
      });

      // For Shopify customer data, we'll create synthetic order data
      if (customerData.customer_email) {
        if (!customerData.order_id) {
          customerData.order_id = `CUST-${Date.now()}-${i}`;
        }
        if (!customerData.order_total) {
          customerData.order_total = 0;
        }
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

    return {
      success: true,
      data: parsedData
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
