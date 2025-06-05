                        disabled={isLoadingUsuarios}
                        title="Recarregar lista de usuários"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      💡 <strong>Dica:</strong> Se o usuário não existir, crie-o primeiro em &quot;Configurações&quot; e &quot;Usuários do Sistema&quot;
                      com o perfil &quot;Médico&quot;. Depois, retorne aqui para vincular. <br />
                      O e-mail do médico e do usuário do sistema devem ser idênticos para o login.
                    </p>
                  </div>
                )}

                {formData.usuario_sistema_id && formData.email && (

