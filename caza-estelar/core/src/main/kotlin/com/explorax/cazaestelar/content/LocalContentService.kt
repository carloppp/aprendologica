package com.explorax.cazaestelar.content

import com.badlogic.gdx.Gdx
import com.explorax.cazaestelar.content.model.ContentCatalog

class LocalContentService(
    private val assetPath: String,
    private val parser: CatalogParser = CatalogParser()
) : ContentService {
    override fun loadPublishedCatalog(): ContentCatalog =
        parser.parse(Gdx.files.internal(assetPath).readString("UTF-8"))
}
