import * as cheerio from 'cheerio'

export function htmlToText(html) {
  const $ = cheerio.load(html)
  $('script, style').remove()
  let text = $.root().text()
  text = text.replace(/\s+/g, ' ').trim()
  return text
}
