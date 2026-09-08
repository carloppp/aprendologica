package com.explorax.cazaestelar.content

import com.explorax.cazaestelar.content.model.ContentCatalog

interface ContentService {
    fun loadPublishedCatalog(): ContentCatalog
}
