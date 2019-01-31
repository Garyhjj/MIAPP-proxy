const puppeteer = require('puppeteer'),
    devices = require('puppeteer/DeviceDescriptors'),
    XLSX = require('xlsx');
async function changePageSize(page, isMobile = false) {
    const dev = devices[isMobile ? 'iPhone 8 Plus' : 'iPad Pro']
    if (!isMobile) {
        dev.name = 'Netscape';
        dev.userAgent = '5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36';
        dev.viewport.isMobile = false;
    }
    return page.emulate(dev);
}
async function getPdfContentByHTML(HTML, isMobile = false, pdfOption = {}) {
    return puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await changePageSize(page, isMobile);
        await page.setContent(HTML);
        const data = await page.pdf(pdfOption);
        await browser.close();
        return data;
    });
}

async function getPdfContentByURL(url, isMobile = false, pdfOption = {}) {
    return puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await changePageSize(page, isMobile);
        await page.goto(url);
        const data = await page.pdf(pdfOption);
        await browser.close();
        return data;
    });
}

function getExcel(header, data) {
    data.unshift(header);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
    /* generate buffer */
    return XLSX.write(wb, {
        type: 'buffer',
        bookType: "xlsx"
    });
}

module.exports = {
    getPdfContentByHTML,
    getPdfContentByURL,
    getExcel
}