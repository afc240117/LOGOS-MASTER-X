from app.services import LogosService
def test_modes():
    s=LogosService()
    for m in ['sermon','bible','study','ebd','outline','assistant','dna']:
        r=s.generate(m,'Lamentações 5:21-22','teste')
        assert r['status']=='PASS'
        assert r['structure']
def test_k7_style():
    s=LogosService(); assert 'Clímax' in s.local_structure('sermon'); assert 'Convite' in s.local_structure('dna')
