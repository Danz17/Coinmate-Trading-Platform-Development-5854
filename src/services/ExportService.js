import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

class ExportServiceClass {
  exportToCSV(data, filename) {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  exportTransactionsToPDF(transactions, title = 'Transaction Report') {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 32);
    
    // Prepare table data
    const tableData = transactions.map(t => [
      format(new Date(t.timestamp), 'MM/dd/yyyy HH:mm'),
      t.type,
      t.user_name,
      t.usdtAmount.toFixed(2),
      t.phpAmount.toFixed(2),
      t.rate.toFixed(2),
      t.platform || '-',
      t.bank || '-',
      t.note || '-'
    ]);
    
    // Add table
    doc.autoTable({
      head: [['Date', 'Type', 'User', 'USDT', 'PHP', 'Rate', 'Platform', 'Bank', 'Note']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 30 }
      }
    });
    
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
  }

  exportHRLogsToPDF(hrLogs, title = 'HR Time Logs') {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 32);
    
    // Prepare table data
    const tableData = hrLogs.map(log => [
      log.user,
      log.loginTime,
      log.logoutTime,
      log.totalHours,
      log.status,
      log.logoutType || '-'
    ]);
    
    // Add table
    doc.autoTable({
      head: [['User', 'Login Time', 'Logout Time', 'Total Hours', 'Status', 'Logout Type']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`hr_logs_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
  }

  exportEODReport(data) {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('End of Day Report', 14, 25);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 35);
    
    // Add summary metrics
    let yPos = 50;
    doc.setFontSize(14);
    doc.text('Summary', 14, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Total PHP Traded: ₱${data.totalPHP.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Total USDT Traded: ${data.totalUSDT.toFixed(2)} USDT`, 14, yPos);
    yPos += 6;
    doc.text(`Net Profit: ₱${data.profit.toFixed(2)}`, 14, yPos);
    yPos += 6;
    doc.text(`Transaction Count: ${data.transactionCount}`, 14, yPos);
    
    // Add transactions table if provided
    if (data.transactions && data.transactions.length > 0) {
      yPos += 20;
      doc.setFontSize(14);
      doc.text('Transactions', 14, yPos);
      
      const tableData = data.transactions.map(t => [
        format(new Date(t.timestamp), 'HH:mm'),
        t.type,
        t.user_name,
        t.usdtAmount.toFixed(2),
        t.phpAmount.toFixed(2),
        t.rate.toFixed(2)
      ]);
      
      doc.autoTable({
        head: [['Time', 'Type', 'User', 'USDT', 'PHP', 'Rate']],
        body: tableData,
        startY: yPos + 5,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    doc.save(`eod_report_${format(new Date(), 'yyyy_MM_dd')}.pdf`);
  }
}

export const ExportService = new ExportServiceClass();