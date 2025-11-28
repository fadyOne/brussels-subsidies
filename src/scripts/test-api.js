// Script pour tester l'API Open Data de Bruxelles et voir les exigences

async function testBrusselsOpenDataAPI() {
  console.log("🔍 Test de l'API Open Data Bruxelles...")

  // Mettre à jour l'URL de base pour correspondre à la console
  const baseUrl = "https://opendata.brussels.be/api/explore/v2.1"

  try {
    // 1. Tester l'accès de base à l'API
    console.log("\n📡 Test 1: Accès de base à l'API")
    const baseResponse = await fetch(`${baseUrl}/catalog/datasets?limit=5`)
    console.log("Status:", baseResponse.status)
    console.log("Headers:", Object.fromEntries(baseResponse.headers.entries()))

    if (baseResponse.ok) {
      const baseData = await baseResponse.json()
      console.log("✅ API accessible sans clé")
      console.log("Nombre de datasets:", baseData.total_count)
      console.log(
        "Premiers datasets:",
        baseData.results?.slice(0, 3).map((d) => d.dataset_id),
      )
    } else {
      console.log("❌ Erreur d'accès:", baseResponse.statusText)
    }

    // 2. Rechercher des datasets liés aux subsides
    console.log("\n🔍 Test 2: Recherche de datasets 'subside'")
    const searchResponse = await fetch(`${baseUrl}/catalog/datasets?q=subside&limit=10`)

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      console.log("✅ Recherche réussie")
      console.log("Datasets trouvés avec 'subside':", searchData.total_count)

      if (searchData.results && searchData.results.length > 0) {
        console.log("📋 Datasets disponibles:")
        searchData.results.forEach((dataset) => {
          console.log(`- ${dataset.dataset_id}: ${dataset.metas?.default?.title || "Sans titre"}`)
        })
      }
    }

    // 3. Rechercher d'autres termes liés
    console.log("\n🔍 Test 3: Recherche d'autres termes")
    const terms = ["subvention", "aide", "financement", "soutien", "allocation"]

    for (const term of terms) {
      try {
        const termResponse = await fetch(`${baseUrl}/catalog/datasets?q=${term}&limit=5`)
        if (termResponse.ok) {
          const termData = await termResponse.json()
          if (termData.total_count > 0) {
            console.log(`📊 "${term}": ${termData.total_count} datasets trouvés`)
            termData.results?.slice(0, 2).forEach((dataset) => {
              console.log(`  - ${dataset.dataset_id}`)
            })
          }
        }
      } catch (error) {
        console.log(`❌ Erreur pour "${term}":`, error.message)
      }
    }

    // 4. Tester l'accès à un dataset spécifique (si trouvé)
    console.log("\n📊 Test 4: Accès à un dataset spécifique")

    // Essayer quelques IDs de datasets possibles
    const possibleDatasets = [
      "subsides-regionaux-bruxelles",
      "aides-financieres-region-bruxelles",
      "subventions-associations",
      "subsides-culture",
      "subsides-sport",
      "subsides-social",
    ]

    for (const datasetId of possibleDatasets) {
      try {
        const datasetResponse = await fetch(`${baseUrl}/catalog/datasets/${datasetId}/records?limit=1`)
        if (datasetResponse.ok) {
          const datasetData = await datasetResponse.json()
          console.log(`✅ Dataset trouvé: ${datasetId}`)
          console.log(`   Total records: ${datasetData.total_count}`)
          if (datasetData.results && datasetData.results.length > 0) {
            console.log(`   Exemple de champs:`, Object.keys(datasetData.results[0].fields || {}))
          }
          break // Arrêter à la première trouvaille
        }
      } catch {
        // Continuer avec le suivant
      }
    }

    // 5. Vérifier les limites de taux
    console.log("\n⏱️ Test 5: Vérification des limites")
    const rateLimitResponse = await fetch(`${baseUrl}/catalog/datasets?limit=1`)
    if (rateLimitResponse.ok) {
      const rateLimitHeaders = rateLimitResponse.headers
      console.log("Rate limit headers:")
      console.log("- X-RateLimit-Limit:", rateLimitHeaders.get("X-RateLimit-Limit"))
      console.log("- X-RateLimit-Remaining:", rateLimitHeaders.get("X-RateLimit-Remaining"))
      console.log("- X-RateLimit-Reset:", rateLimitHeaders.get("X-RateLimit-Reset"))
    }

    // Ajouter un test spécifique pour les endpoints visibles dans la console
    console.log("\n🎯 Test des endpoints de la console officielle")

    // Test de l'endpoint /catalog/datasets visible dans la console
    const catalogResponse = await fetch(`${baseUrl}/catalog/datasets?limit=10`)
    console.log("Status /catalog/datasets:", catalogResponse.status)

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json()
      console.log("✅ Endpoint /catalog/datasets accessible")
      console.log("Total datasets:", catalogData.total_count)

      // Afficher les premiers datasets avec leurs IDs exacts
      if (catalogData.results) {
        console.log("\n📋 Datasets disponibles:")
        catalogData.results.forEach((dataset, index) => {
          console.log(`${index + 1}. ID: ${dataset.dataset_id}`)
          console.log(`   Titre: ${dataset.metas?.default?.title || "Sans titre"}`)
          console.log(
            `   Description: ${dataset.metas?.default?.description?.substring(0, 100) || "Pas de description"}...`,
          )
          console.log("")
        })
      }
    }

    // Test spécifique pour trouver des datasets avec "subside" dans le titre ou la description
    console.log("\n🔍 Recherche spécifique de datasets de subsides")
    const subsidesSearch = await fetch(`${baseUrl}/catalog/datasets?q=subside&limit=20`)

    if (subsidesSearch.ok) {
      const subsidesData = await subsidesSearch.json()
      console.log(`📊 Datasets trouvés avec "subside": ${subsidesData.total_count}`)

      if (subsidesData.results && subsidesData.results.length > 0) {
        subsidesData.results.forEach((dataset) => {
          console.log(`🎯 DATASET POTENTIEL: ${dataset.dataset_id}`)
          console.log(`   Titre: ${dataset.metas?.default?.title}`)
          console.log(`   URL test: ${baseUrl}/catalog/datasets/${dataset.dataset_id}/records?limit=1`)
          console.log("")
        })
      }
    }
  } catch (error) {
    console.error("❌ Erreur générale:", error)

    // Vérifier si c'est un problème CORS
    if (error.message.includes("CORS")) {
      console.log("🚨 Problème CORS détecté - l'API pourrait nécessiter:")
      console.log("- Une clé API")
      console.log("- Des headers spécifiques")
      console.log("- Un domaine autorisé")
    }
  }

  // 6. Informations sur l'authentification
  console.log("\n🔐 Informations d'authentification:")
  console.log("- L'API Open Data de Bruxelles est généralement publique")
  console.log("- Vérifiez sur https://opendata.bruxelles.be si une inscription est nécessaire")
  console.log("- Certains datasets peuvent nécessiter une authentification")
}

// Exécuter le test
testBrusselsOpenDataAPI()
