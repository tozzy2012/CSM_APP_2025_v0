
# ============================================================================
# ROTAS DE IMPORTAÇÃO DE CLIENTES
# ============================================================================

@app.get(
    f"{settings.API_PREFIX}/clients/import/template",
    summary="Download Template de Importação",
    description="Retorna um arquivo CSV modelo para importação de clientes"
)
async def get_clients_import_template():
    """Retorna template CSV para importação de clientes"""
    headers = [
        "name", "legal_name", "cnpj", "industry", 
        "website", "company_size", "notes", "tags"
    ]
    
    # Criar arquivo CSV em memória
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')
    
    # Escrever cabeçalho
    writer.writerow(headers)
    
    # Escrever linha de exemplo
    writer.writerow([
        "Empresa Exemplo Ltda", "Razão Social Exemplo", "12.345.678/0001-90", 
        "Tecnologia", "https://exemplo.com.br", "medium", 
        "Cliente estratégico", "tech,saas,prioridade"
    ])
    
    stream.seek(0)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    
    response.headers["Content-Disposition"] = "attachment; filename=template_clientes.csv"
    
    return response


@app.post(
    f"{settings.API_PREFIX}/clients/import",
    summary="Importar Clientes via CSV",
    description="Importa clientes a partir de um arquivo CSV"
)
async def import_clients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Importa clientes via CSV"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo deve ser um CSV"
        )
    
    try:
        # Ler conteúdo do arquivo
        content = await file.read()
        
        # Decodificar conteúdo (tentar utf-8, fallback para latin-1)
        try:
            decoded_content = content.decode('utf-8')
        except UnicodeDecodeError:
            decoded_content = content.decode('latin-1')
            
        # Processar CSV
        csv_reader = csv.DictReader(io.StringIO(decoded_content), delimiter=';')
        
        # Verificar headers
        required_fields = ["name", "legal_name", "cnpj"]
        if not csv_reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo CSV vazio ou inválido"
            )
            
        missing_fields = [field for field in required_fields if field not in csv_reader.fieldnames]
        if missing_fields:
            # Tentar com vírgula se ponto e vírgula falhou
            csv_reader = csv.DictReader(io.StringIO(decoded_content), delimiter=',')
            missing_fields = [field for field in required_fields if field not in csv_reader.fieldnames]
            
            if missing_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Campos obrigatórios ausentes: {', '.join(missing_fields)}. Verifique se o delimitador é ';' ou ','"
                )
        
        results = {
            "success": 0,
            "errors": 0,
            "duplicates": 0,
            "details": []
        }
        
        from uuid import uuid4
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validar dados básicos
                if not row.get("name") or not row.get("cnpj"):
                    results["errors"] += 1
                    results["details"].append(f"Linha {row_num}: Nome ou CNPJ ausente")
                    continue
                
                # Limpar CNPJ (apenas números)
                cnpj_clean = ''.join(filter(str.isdigit, row.get("cnpj", "")))
                
                # Verificar duplicidade
                existing_client = db.query(models.Client).filter(
                    models.Client.cnpj.like(f"%{cnpj_clean}%")
                ).first()
                
                if existing_client:
                    results["duplicates"] += 1
                    results["details"].append(f"Linha {row_num}: CNPJ {row.get('cnpj')} já existe (Cliente: {existing_client.name})")
                    continue
                
                # Processar tags
                tags_str = row.get("tags", "")
                tags_list = [t.strip() for t in tags_str.split(",")] if tags_str else []
                
                # Criar cliente
                new_client = models.Client(
                    id=str(uuid4()),
                    name=row.get("name"),
                    legal_name=row.get("legal_name", row.get("name")),
                    cnpj=row.get("cnpj"),
                    industry=row.get("industry"),
                    website=row.get("website"),
                    company_size=row.get("company_size", "small"),
                    notes=row.get("notes"),
                    tags=tags_list,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(new_client)
                results["success"] += 1
                
            except Exception as e:
                results["errors"] += 1
                results["details"].append(f"Linha {row_num}: Erro ao processar - {str(e)}")
        
        db.commit()
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na importação de clientes: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar arquivo: {str(e)}"
        )
