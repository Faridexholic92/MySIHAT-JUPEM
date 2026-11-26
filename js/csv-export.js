/**
 * Utiliti Eksport Data kepada CSV (serasi Microsoft Excel dengan UTF-8 BOM)
 * dan Spreadsheet Excel (.xls) beserta perlindungan formula injection.
 */
(function (root) {
  'use strict';

  /**
   * Elakkan CSV/Excel formula injection jika sel bermula dengan =, +, -, @, tab, CR.
   */
  function sanitizeSpreadsheetCell(value) {
    if (value === null || value === undefined) return '';
    var str = Array.isArray(value) ? value.join('; ') : String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
      return "'" + str;
    }
    return str;
  }

  /**
   * Escape satu sel CSV mengikut RFC 4180.
   */
  function escapeCSVCell(value) {
    var safe = sanitizeSpreadsheetCell(value);
    if (/[",\r\n]/.test(safe)) {
      return '"' + safe.replace(/"/g, '""') + '"';
    }
    return safe;
  }

  /**
   * Bina rentetan CSV lengkap dengan UTF-8 BOM (\uFEFF) supaya Excel
   * membaca aksara Bahasa Melayu & simbol dengan sempurna.
   */
  function buildCSV(headers, rows) {
    var lines = [];
    lines.push(headers.map(escapeCSVCell).join(','));
    for (var i = 0; i < rows.length; i += 1) {
      lines.push(rows[i].map(escapeCSVCell).join(','));
    }
    return '\uFEFF' + lines.join('\r\n');
  }

  function escapeXML(value) {
    return sanitizeSpreadsheetCell(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Bina fail Excel SpreadsheetML 2003 (.xls) yang bersih tanpa kebergantungan luaran,
   * memaksa nombor IC & telefon kekal sebagai teks (tidak bertukar jadi 9.005E+11).
   */
  function buildExcelXML(sheetName, headers, rows) {
    var safeSheet = escapeXML(sheetName || 'Deklarasi Kesihatan').slice(0, 31);
    var headerCells = headers
      .map(function (h) {
        return '<Cell ss:StyleID="header"><Data ss:Type="String">' + escapeXML(h) + '</Data></Cell>';
      })
      .join('');

    var bodyRows = rows
      .map(function (row) {
        var cells = row
          .map(function (cell) {
            var isNumericAge = typeof cell === 'number' && Number.isFinite(cell);
            if (isNumericAge) {
              return '<Cell><Data ss:Type="Number">' + cell + '</Data></Cell>';
            }
            return '<Cell><Data ss:Type="String">' + escapeXML(cell) + '</Data></Cell>';
          })
          .join('');
        return '<Row>' + cells + '</Row>';
      })
      .join('');

    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
      ' <Styles>\n' +
      '  <Style ss:ID="header">\n' +
      '   <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n' +
      '   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>\n' +
      '  </Style>\n' +
      ' </Styles>\n' +
      ' <Worksheet ss:Name="' + safeSheet + '">\n' +
      '  <Table>\n' +
      '   <Row>' + headerCells + '</Row>\n' +
      '   ' + bodyRows + '\n' +
      '  </Table>\n' +
      ' </Worksheet>\n' +
      '</Workbook>'
    );
  }

  function triggerDownload(filename, content, mimeType) {
    if (typeof document === 'undefined' || typeof Blob === 'undefined') return;
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  var api = {
    sanitizeSpreadsheetCell: sanitizeSpreadsheetCell,
    escapeCSVCell: escapeCSVCell,
    buildCSV: buildCSV,
    buildExcelXML: buildExcelXML,
    triggerDownload: triggerDownload
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CSVExport = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
