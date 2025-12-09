import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TEMPLATES = {
  modern: {
    primaryColor: [59, 130, 246], // Blue
    headerBg: [59, 130, 246],
    headerText: [255, 255, 255],
    tableBg: [243, 244, 246],
  },
  classic: {
    primaryColor: [31, 41, 55], // Gray
    headerBg: [31, 41, 55],
    headerText: [255, 255, 255],
    tableBg: [249, 250, 251],
  },
  minimal: {
    primaryColor: [0, 0, 0], // Black
    headerBg: [255, 255, 255],
    headerText: [0, 0, 0],
    tableBg: [255, 255, 255],
  },
};

const CURRENCY_SYMBOLS = {
  PKR: 'Rs.',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
};

function formatCurrency(amount, currency = 'PKR') {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateInvoicePDF(invoice, business, customer, template = 'modern') {
  const doc = new jsPDF();
  const colors = TEMPLATES[template] || TEMPLATES.modern;
  const currency = business?.currency || 'PKR';
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Add watermark for DRAFT or PAID status
  if (invoice.status === 'DRAFT' || invoice.status === 'PAID') {
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.text(invoice.status, pageWidth / 2, 150, {
      align: 'center',
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  // Header Section
  if (template === 'modern') {
    // Modern template with colored header bar
    doc.setFillColor(...colors.headerBg);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(...colors.headerText);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(business?.businessName || 'Your Business', margin, 25);
    
    doc.setFontSize(28);
    doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });
    
    yPos = 55;
    doc.setTextColor(0, 0, 0);
  } else if (template === 'classic') {
    // Classic template
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(business?.businessName || 'Your Business', margin, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    if (business?.email) {
      doc.text(business.email, margin, yPos);
      yPos += 5;
    }
    if (business?.phone) {
      doc.text(business.phone, margin, yPos);
      yPos += 5;
    }
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primaryColor);
    doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    yPos += 10;
  } else {
    // Minimal template
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(business?.businessName || 'Your Business', margin, yPos);
    
    doc.setFontSize(18);
    doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
    
    yPos += 15;
  }

  // Invoice Details (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const detailsX = pageWidth - margin - 60;
  let detailsY = yPos;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', detailsX, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber || 'INV-0001', detailsX + 35, detailsY);
  detailsY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', detailsX, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.date), detailsX + 35, detailsY);
  detailsY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', detailsX, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.dueDate), detailsX + 35, detailsY);

  // Bill To Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primaryColor);
  doc.text('BILL TO', margin, yPos);
  doc.setTextColor(0, 0, 0);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(customer?.name || 'Customer Name', margin, yPos);
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  if (customer?.email) {
    doc.text(customer.email, margin, yPos);
    yPos += 5;
  }
  if (customer?.phone) {
    doc.text(customer.phone, margin, yPos);
    yPos += 5;
  }
  if (customer?.address) {
    const addressParts = [
      customer.address.street,
      customer.address.city,
      customer.address.state,
      customer.address.country,
    ].filter(Boolean);
    if (addressParts.length > 0) {
      doc.text(addressParts.join(', '), margin, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Items Table
  const tableData = (invoice.items || []).map((item, index) => [
    index + 1,
    item.description || '',
    item.quantity || 0,
    formatCurrency(item.price || 0, currency),
    formatCurrency((item.quantity || 0) * (item.price || 0), currency),
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: template === 'minimal' ? 'plain' : 'striped',
    headStyles: {
      fillColor: colors.headerBg,
      textColor: colors.headerText,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: colors.tableBg,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Totals Section
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(formatCurrency(invoice.subtotal || 0, currency), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Discount
  if (invoice.discount > 0) {
    doc.setTextColor(34, 197, 94); // Green
    doc.text('Discount:', totalsX, yPos);
    doc.text(`-${formatCurrency(invoice.discount, currency)}`, pageWidth - margin, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }
  
  // Tax
  if (invoice.tax > 0) {
    doc.text(`Tax (${invoice.taxRate || 0}%):`, totalsX, yPos);
    doc.text(formatCurrency(invoice.tax, currency), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Total
  yPos += 2;
  doc.setDrawColor(...colors.primaryColor);
  doc.line(totalsX, yPos, pageWidth - margin, yPos);
  yPos += 6;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, yPos);
  doc.setTextColor(...colors.primaryColor);
  doc.text(formatCurrency(invoice.total || 0, currency), pageWidth - margin, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos += 15;

  // Notes Section
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 4 + 5;
  }

  // Terms Section
  if (invoice.terms) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(termLines, margin, yPos);
    yPos += termLines.length * 4 + 5;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  
  if (business?.email || business?.phone) {
    const contactInfo = [business.email, business.phone].filter(Boolean).join(' | ');
    doc.text(contactInfo, pageWidth / 2, footerY + 5, { align: 'center' });
  }

  return doc;
}

export function downloadInvoicePDF(invoice, business, customer, template = 'modern') {
  const doc = generateInvoicePDF(invoice, business, customer, template);
  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
}

export function getInvoicePDFBlob(invoice, business, customer, template = 'modern') {
  const doc = generateInvoicePDF(invoice, business, customer, template);
  return doc.output('blob');
}

export function getInvoicePDFBase64(invoice, business, customer, template = 'modern') {
  const doc = generateInvoicePDF(invoice, business, customer, template);
  return doc.output('datauristring');
}
