package com.explorax.cazaestelar.content

import com.explorax.cazaestelar.content.model.ContentCatalog

object CatalogUpdatePolicy {
    fun selectStartup(bundled: ContentCatalog, cached: ContentCatalog?): ContentCatalog =
        if (cached != null && cached.revision > bundled.revision) cached else bundled

    fun isNewer(current: ContentCatalog, candidate: ContentCatalog): Boolean =
        candidate.revision > current.revision
}
