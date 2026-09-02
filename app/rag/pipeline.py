class SimpleRAG:
    def __init__(self, repository):
        self.repository = repository

    def retrieve(self, query):
        return self.repository.search(query)
