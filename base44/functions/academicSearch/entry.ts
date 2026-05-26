import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SOURCES = {
  arxiv: {
    name: "arXiv",
    label: "arXiv (preprint scientifici)",
    icon: "📐",
    category: "Scienze, Matematica, Informatica, Fisica",
  },
  semantic_scholar: {
    name: "Semantic Scholar",
    label: "Semantic Scholar (200M paper)",
    icon: "🔬",
    category: "Letteratura accademica cross-disciplinare",
  },
  openlibrary: {
    name: "Open Library",
    label: "Open Library / Internet Archive",
    icon: "📖",
    category: "Libri liberi e digitalizzati",
  },
  pubmed: {
    name: "PubMed / Europe PMC",
    label: "PubMed / Europe PMC",
    icon: "⚕️",
    category: "Medicina, Biologia, Salute",
  },
  core: {
    name: "CORE",
    label: "CORE (Open Access Research)",
    icon: "🎓",
    category: "Articoli accademici open-access",
  },
  gutenberg: {
    name: "Project Gutenberg",
    label: "Project Gutenberg",
    icon: "📜",
    category: "Classici letterari liberi da copyright",
  },
  doaj: {
    name: "DOAJ",
    label: "DOAJ (Directory Open Access Journals)",
    icon: "📋",
    category: "Riviste accademiche open-access",
  },
};

async function searchArXiv(query, limit = 10, sortBy = "relevance") {
  const sortMap = { relevance: "relevance", date: "submittedDate", citations: "relevance" };
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}&sortBy=${sortMap[sortBy] || "relevance"}&sortOrder=descending`;
  const resp = await fetch(url);
  const xml = await resp.text();

  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  return entries.map(entry => {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || "";
    const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || "";
    const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() || "";
    const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1].trim()).slice(0, 4);
    const pdfLink = entry.match(/<link[^>]*rel="related"[^>]*href="([^"]*\.pdf)"/)?.[1] ||
      id.replace("abs", "pdf");
    const arxivId = id.split("/abs/")[1] || "";

    return {
      id: `arxiv_${arxivId}`,
      source: "arXiv",
      source_key: "arxiv",
      icon: "📐",
      title: title.replace(/\n\s*/g, " "),
      abstract: abstract.replace(/\n\s*/g, " ").slice(0, 600) + (abstract.length > 600 ? "..." : ""),
      authors,
      year: published ? new Date(published).getFullYear() : null,
      url: id,
      pdf_url: pdfLink,
      type: "Preprint",
      institution: "arXiv.org (Cornell University)",
    };
  });
}

async function searchSemanticScholar(query, limit = 10, sortBy = "relevance") {
  const fields = "title,abstract,authors,year,openAccessPdf,externalIds,citationCount,publicationVenue,publicationTypes";
  const sort = sortBy === "citations" ? "&sort=citationCount" : sortBy === "date" ? "&sort=publicationDate" : "";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=${limit}${sort}`;
  const resp = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!resp.ok) return [];
  const data = await resp.json();

  return (data.data || []).map(p => ({
    id: `ss_${p.paperId}`,
    source: "Semantic Scholar",
    source_key: "semantic_scholar",
    icon: "🔬",
    title: p.title || "",
    abstract: (p.abstract || "").slice(0, 600) + ((p.abstract || "").length > 600 ? "..." : ""),
    authors: (p.authors || []).slice(0, 4).map(a => a.name),
    year: p.year || null,
    url: `https://www.semanticscholar.org/paper/${p.paperId}`,
    pdf_url: p.openAccessPdf?.url || null,
    type: (p.publicationTypes || ["Paper"])[0],
    institution: p.publicationVenue?.name || "Semantic Scholar",
    citations: p.citationCount || 0,
  }));
}

async function searchOpenLibrary(query, limit = 10) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,first_publish_year,subject,ia,cover_i&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();

  return (data.docs || []).map(book => ({
    id: `ol_${book.key?.replace("/works/", "") || Math.random()}`,
    source: "Open Library",
    source_key: "openlibrary",
    icon: "📖",
    title: book.title || "",
    abstract: (book.subject || []).slice(0, 10).join(", ") || "Nessuna descrizione disponibile.",
    authors: (book.author_name || []).slice(0, 3),
    year: book.first_publish_year || null,
    url: `https://openlibrary.org${book.key}`,
    pdf_url: book.ia ? `https://archive.org/details/${book.ia[0]}` : null,
    type: "Libro",
    institution: "Open Library / Internet Archive",
  }));
}

async function searchPubMed(query, limit = 10, sortBy = "relevance") {
  const sortParam = sortBy === "date" ? "&sort=date" : sortBy === "citations" ? "&sort=relevance" : "&sort=relevance";
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}${sortParam}&retmode=json`;
  const searchResp = await fetch(searchUrl);
  if (!searchResp.ok) return [];
  const searchData = await searchResp.json();
  const ids = searchData.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml`;
  const fetchResp = await fetch(fetchUrl);
  const xml = await fetchResp.text();

  const articles = xml.match(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g) || [];
  return articles.map((art, i) => {
    const title = art.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    const abstract = art.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    const pmid = art.match(/<PMID[^>]*>([\s\S]*?)<\/PMID>/)?.[1]?.trim() || ids[i];
    const year = art.match(/<PubDate>[\s\S]*?<Year>([\s\S]*?)<\/Year>/)?.[1]?.trim() || "";
    const authorMatches = [...art.matchAll(/<LastName>([\s\S]*?)<\/LastName>[\s\S]*?<ForeName>([\s\S]*?)<\/ForeName>/g)];
    const authors = authorMatches.slice(0, 4).map(m => `${m[1]} ${m[2]}`);
    const journal = art.match(/<Journal>[\s\S]*?<Title>([\s\S]*?)<\/Title>/)?.[1]?.trim() || "";

    return {
      id: `pubmed_${pmid}`,
      source: "PubMed",
      source_key: "pubmed",
      icon: "⚕️",
      title: title.replace(/\[.*?\]/g, "").trim(),
      abstract: abstract.slice(0, 600) + (abstract.length > 600 ? "..." : ""),
      authors,
      year: year ? parseInt(year) : null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      pdf_url: `https://www.ncbi.nlm.nih.gov/pmc/articles/pmid/${pmid}/pdf/`,
      type: "Articolo",
      institution: journal || "PubMed / NCBI",
    };
  });
}

async function searchCORE(query, limit = 10, sortBy = "relevance") {
  const sortField = sortBy === "date" ? "publishedDate" : sortBy === "citations" ? "citationCount" : "_score";
  const url = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${limit}&sort=${sortField}:desc`;
  const resp = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!resp.ok) return [];
  const data = await resp.json();

  return (data.results || []).map(p => ({
    id: `core_${p.id}`,
    source: "CORE",
    source_key: "core",
    icon: "🎓",
    title: p.title || "",
    abstract: (p.abstract || "").slice(0, 600) + ((p.abstract || "").length > 600 ? "..." : ""),
    authors: (p.authors || []).slice(0, 4).map(a => a.name),
    year: p.yearPublished || null,
    url: `https://core.ac.uk/works/${p.id}`,
    pdf_url: p.downloadUrl || null,
    type: p.documentType || "Articolo",
    institution: (p.dataProviders || [])[0]?.name || "CORE Open Access",
    doi: p.doi || null,
  }));
}

async function searchGutenberg(query, limit = 10) {
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=1`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();

  return (data.results || []).slice(0, limit).map(book => ({
    id: `gutenberg_${book.id}`,
    source: "Project Gutenberg",
    source_key: "gutenberg",
    icon: "📜",
    title: book.title || "",
    abstract: `Soggetti: ${(book.subjects || []).slice(0, 5).join(", ") || "Non specificato"}. Scaffale: ${(book.bookshelves || []).join(", ") || "—"}`,
    authors: (book.authors || []).map(a => a.name),
    year: (book.authors || [])[0]?.birth_year || null,
    url: `https://www.gutenberg.org/ebooks/${book.id}`,
    pdf_url: book.formats?.["application/pdf"] || book.formats?.["text/html"] || null,
    type: "Classico letterario",
    institution: "Project Gutenberg",
    downloads: book.download_count,
  }));
}

async function searchDOAJ(query, limit = 10, sortBy = "relevance") {
  const sortParam = sortBy === "date" ? "&sort=created_date&order=desc" : "";
  const url = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=${limit}${sortParam}`;
  const resp = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!resp.ok) return [];
  const data = await resp.json();

  return (data.results || []).map(item => {
    const bib = item.bibjson || {};
    return {
      id: `doaj_${item.id}`,
      source: "DOAJ",
      source_key: "doaj",
      icon: "📋",
      title: bib.title || "",
      abstract: (bib.abstract || "").slice(0, 600) + ((bib.abstract || "").length > 600 ? "..." : ""),
      authors: (bib.author || []).slice(0, 4).map(a => a.name),
      year: bib.year ? parseInt(bib.year) : null,
      url: item.id ? `https://doaj.org/article/${item.id}` : null,
      pdf_url: (bib.link || []).find(l => l.type === "fulltext")?.url || null,
      type: "Articolo di rivista",
      institution: bib.journal?.title || "DOAJ Journal",
      doi: (bib.identifier || []).find(i => i.type === "doi")?.id || null,
    };
  });
}

const searcherMap = {
  arxiv: searchArXiv,
  semantic_scholar: searchSemanticScholar,
  openlibrary: searchOpenLibrary,
  pubmed: searchPubMed,
  core: searchCORE,
  gutenberg: searchGutenberg,
  doaj: searchDOAJ,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { query, sources = Object.keys(SOURCES), limit = 8, sortBy = "relevance" } = body;

    if (!query || query.trim() === "") {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    // Run all selected sources in parallel
    const promises = sources.map(async (sourceKey) => {
      const fn = searcherMap[sourceKey];
      if (!fn) return { sourceKey, results: [], error: "Unknown source" };
      const results = await fn(query.trim(), Math.min(limit, 15), sortBy);
      return { sourceKey, results };
    });

    const settled = await Promise.allSettled(promises);
    const results = {};

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        const { sourceKey, results: res } = outcome.value;
        results[sourceKey] = res || [];
      } else {
        const sk = settled.indexOf(outcome);
        results[`source_${sk}`] = [];
      }
    }

    const allResults = Object.values(results).flat();
    const totalCount = allResults.length;

    return Response.json({
      query,
      total: totalCount,
      sources_searched: sources,
      results,
      sources_meta: SOURCES,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});