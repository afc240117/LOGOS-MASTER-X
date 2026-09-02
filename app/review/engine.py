class ReviewEngine:
    def review(self, output):
        return {"approved": bool(output), "issues": [] if output else ["Saída vazia"]}
