// Service pour afficher le livre actuellement en lecture
// Mettez à jour les données ci-dessous avec votre livre actuel

export type ReadingData = {
  isReading: boolean
  title: string
  author: string
  coverUrl: string
  progress: number // Pourcentage de 0 à 100
  quote: string
  bookUrl?: string // Lien vers Goodreads, Literal, etc.
}

const getCurrentReading = async (): Promise<ReadingData> => {
  // TODO: Mettre à jour ces données avec votre livre actuel
  return {
    isReading: true,
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg",
    progress: 45, // Pourcentage de lecture
    quote: "Don't live with broken windows.",
    bookUrl: "https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer"
  }
}

export default getCurrentReading
