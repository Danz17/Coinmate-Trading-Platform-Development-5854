class ExportServiceClass {
  /**
   * Export data to CSV
   * @param {Array} data - Data to export
   * @param {string} filename - Filename for export
   */
  exportToCsv(data, filename = 'export.csv') {
    try {
      if (!data || !data.length) {
        console.error('No data to export');
        return;
      }
      
      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        // Headers row
        headers.join(','),
        // Data rows
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            
            // Handle null and undefined values
            if (value === null || value === undefined) {
              return '';
            }
            
            // Convert objects to JSON
            if (typeof value === 'object') {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            
            // Escape quotes in strings
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
          }).join(',')
        )
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  }

  /**
   * Export data to JSON
   * @param {Array|Object} data - Data to export
   * @param {string} filename - Filename for export
   */
  exportToJson(data, filename = 'export.json') {
    try {
      if (!data) {
        console.error('No data to export');
        return;
      }
      
      // Create JSON content
      const jsonContent = JSON.stringify(data, null, 2);
      
      // Create download link
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
    }
  }

  /**
   * Export data to Excel (XLSX)
   * @param {Array} data - Data to export
   * @param {string} filename - Filename for export
   */
  exportToExcel(data, filename = 'export.xlsx') {
    try {
      // We're using CSV as a fallback since we don't have xlsx library
      console.warn('Excel export is not available. Falling back to CSV export.');
      this.exportToCsv(data, filename.replace('.xlsx', '.csv'));
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }

  /**
   * Export data to PDF
   * @param {Array} data - Data to export
   * @param {string} filename - Filename for export
   */
  exportToPdf(data, filename = 'export.pdf') {
    try {
      // We're using CSV as a fallback since we don't have PDF library
      console.warn('PDF export is not available. Falling back to CSV export.');
      this.exportToCsv(data, filename.replace('.pdf', '.csv'));
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  }

  /**
   * Export table to CSV
   * @param {HTMLTableElement} table - Table element to export
   * @param {string} filename - Filename for export
   */
  exportTableToCsv(table, filename = 'table-export.csv') {
    try {
      if (!table) {
        console.error('No table to export');
        return;
      }
      
      // Get table headers
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => 
        th.textContent.trim()
      );
      
      // Get table rows
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => 
          `"${td.textContent.trim().replace(/"/g, '""')}"`
        ).join(',')
      );
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting table to CSV:', error);
    }
  }

  /**
   * Export chart data
   * @param {Object} chart - Chart object
   * @param {string} format - Export format ('csv', 'json', 'png')
   * @param {string} filename - Filename for export
   */
  exportChartData(chart, format = 'csv', filename = 'chart-export') {
    try {
      if (!chart || !chart.data) {
        console.error('No chart data to export');
        return;
      }
      
      // Get chart data
      const chartData = chart.data;
      
      // Export based on format
      switch (format.toLowerCase()) {
        case 'csv':
          this.exportToCsv(chartData, `${filename}.csv`);
          break;
        case 'json':
          this.exportToJson(chartData, `${filename}.json`);
          break;
        case 'png':
          // Fallback to JSON for PNG since we can't create images here
          console.warn('PNG export is not available. Falling back to JSON export.');
          this.exportToJson(chartData, `${filename}.json`);
          break;
        default:
          this.exportToCsv(chartData, `${filename}.csv`);
      }
    } catch (error) {
      console.error('Error exporting chart data:', error);
    }
  }

  /**
   * Format number for export
   * @param {number} value - Number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted number
   */
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '';
    
    try {
      return parseFloat(value).toFixed(decimals);
    } catch (error) {
      console.error('Error formatting number:', error);
      return value.toString();
    }
  }

  /**
   * Format date for export
   * @param {string|Date} date - Date to format
   * @param {string} format - Date format ('iso', 'short', 'long')
   * @returns {string} - Formatted date
   */
  formatDate(date, format = 'iso') {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      
      switch (format) {
        case 'iso':
          return dateObj.toISOString();
        case 'short':
          return dateObj.toLocaleDateString();
        case 'long':
          return dateObj.toLocaleString();
        default:
          return dateObj.toISOString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  }
}

export const ExportService = new ExportServiceClass();