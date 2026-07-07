// --- GLOBAL APP STATE ---
let appData = {
    originalFilename: '',
    downloadUrl: '',
    columns: [],
    previewData: [],
    cpfColumn: '',
    mapping: {
        filial: null,
        servico: null,
        recebimento: null,
        nome: null,
        cpf: null
    }
};

// --- ON DOM LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // --- TAB SWITCHING LOGIC ---
    const tabFaturamentoBtn = document.getElementById('tab-faturamento-btn');
    const tabCpfBtn = document.getElementById('tab-cpf-btn');
    const tabFaturamentoContent = document.getElementById('tab-faturamento-content');
    const tabCpfContent = document.getElementById('tab-cpf-content');

    const switchTab = (activeTab) => {
        if (activeTab === 'faturamento') {
            tabFaturamentoBtn.classList.add('active');
            tabCpfBtn.classList.remove('active');
            tabFaturamentoContent.classList.add('active');
            tabCpfContent.classList.remove('active');
            // Auto fetch report on tab view
            fetchFaturamentoReport();
        } else {
            tabCpfBtn.classList.add('active');
            tabFaturamentoBtn.classList.remove('active');
            tabCpfContent.classList.add('active');
            tabFaturamentoContent.classList.remove('active');
        }
    };

    if (tabFaturamentoBtn && tabCpfBtn) {
        tabFaturamentoBtn.addEventListener('click', () => switchTab('faturamento'));
        tabCpfBtn.addEventListener('click', () => switchTab('cpf'));
    }

    // --- USER PROFILE & PASSWORD MODAL CONTROLS ---
    const user = window.currentUser || { name: 'Usuário', username: '' };
    const avatarEl = document.getElementById('user-avatar-initials');
    if (avatarEl && user.name) {
        const parts = user.name.trim().split(' ');
        const initials = parts.length > 1 
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }

    const userProfileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });
    }

    const passwordModal = document.getElementById('password-modal');
    const btnOpenPasswordModal = document.getElementById('btn-open-password-modal');
    const btnClosePasswordModal = document.getElementById('btn-close-password-modal');
    const btnCancelPasswordModal = document.getElementById('btn-cancel-password-modal');
    const changePasswordForm = document.getElementById('change-password-form');

    if (btnOpenPasswordModal && passwordModal) {
        btnOpenPasswordModal.addEventListener('click', (e) => {
            e.stopPropagation();
            passwordModal.classList.add('active');
            profileDropdown.classList.remove('active');
        });

        const closePasswordModal = () => {
            passwordModal.classList.remove('active');
            changePasswordForm.reset();
        };

        if (btnClosePasswordModal) btnClosePasswordModal.addEventListener('click', closePasswordModal);
        if (btnCancelPasswordModal) btnCancelPasswordModal.addEventListener('click', closePasswordModal);

        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                closePasswordModal();
            }
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showToast('A nova senha e a confirmação de senha não coincidem.', 'error');
                return;
            }
            
            fetch('/change_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status, body }) => {
                if (status !== 200) {
                    throw new Error(body.error || 'Erro ao alterar a senha.');
                }
                
                showToast('Senha alterada com sucesso!', 'success');
                passwordModal.classList.remove('active');
                changePasswordForm.reset();
            })
            .catch(err => {
                showToast(err.message, 'error');
            });
        });
    }

    // ==========================================
    // --- FATURAMENTO: CONTROLS & REPORT ---
    // ==========================================
    const btnStartRpa = document.getElementById('btn-start-rpa');
    const rpaSpinner = document.getElementById('rpa-spinner');
    const rpaStatusMsg = document.getElementById('rpa-status-msg');

    if (btnStartRpa) {
        btnStartRpa.addEventListener('click', async () => {
            // Activating UI loading state
            rpaSpinner.classList.add('active');
            btnStartRpa.disabled = true;
            rpaStatusMsg.textContent = "Iniciando processo...";
            rpaStatusMsg.className = "faturamento-status-message";

            try {
                const res = await fetch("/start_async", { method: "POST" });
                const data = await res.json();

                if (!data.ok) throw new Error(data.error || "Falha ao iniciar processo");

                rpaStatusMsg.textContent = "Processando… aguarde.";
                rpaStatusMsg.className = "faturamento-status-message ok";

                // Resilient wait status checker
                const checkStatus = async () => {
                    try {
                        const final = await fetch("/wait_finish", { method: "GET" });
                        const done = await final.json();

                        if (done.ready) {
                            rpaSpinner.classList.remove('active');
                            btnStartRpa.disabled = false;
                            rpaStatusMsg.textContent = "Processo finalizado com sucesso!";
                            rpaStatusMsg.className = "faturamento-status-message ok";
                            showToast("Faturamento processado com sucesso!", "success");
                        } else {
                            setTimeout(checkStatus, 3000);
                        }
                    } catch (e) {
                        setTimeout(checkStatus, 3000);
                    }
                };

                setTimeout(checkStatus, 3000);

            } catch (e) {
                rpaSpinner.classList.remove('active');
                btnStartRpa.disabled = false;
                rpaStatusMsg.textContent = e.message || "Erro inesperado.";
                rpaStatusMsg.className = "faturamento-status-message err";
                showToast(e.message || "Erro inesperado.", "error");
            }
        });
    }



    // ==========================================
    // --- CORRETOR DE CPF: DRAG & DROP & MAPPING ---
    // ==========================================
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSectionCpf = document.getElementById('upload-section-cpf');
    const processingSection = document.getElementById('processing-section');
    const dashboardSectionCpf = document.getElementById('dashboard-section-cpf');
    const progressBar = document.getElementById('progress-bar');
    
    const btnBackCpf = document.getElementById('btn-back-cpf');
    const btnDownloadCpf = document.getElementById('btn-download-cpf');
    const btnClearFilters = document.getElementById('btn-clear-filters');
    
    // Filters
    const filterFilial = document.getElementById('filter-filial');
    const filterServico = document.getElementById('filter-servico');
    const filterRecebimento = document.getElementById('filter-recebimento');
    const searchNome = document.getElementById('search-nome');
    const searchCpf = document.getElementById('search-cpf');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleFile(fileInput.files[0]);
            }
        });
    }

    if (btnBackCpf) {
        btnBackCpf.addEventListener('click', () => {
            fileInput.value = '';
            appData = {
                originalFilename: '',
                downloadUrl: '',
                columns: [],
                previewData: [],
                cpfColumn: '',
                mapping: { filial: null, servico: null, recebimento: null, nome: null, cpf: null }
            };
            
            filterFilial.innerHTML = '<option value="">Todos</option>';
            filterServico.innerHTML = '<option value="">Todos</option>';
            filterRecebimento.innerHTML = '<option value="">Todos</option>';
            searchNome.value = '';
            searchCpf.value = '';

            dashboardSectionCpf.classList.remove('active');
            uploadSectionCpf.classList.add('active');
        });
    }

    if (filterFilial) filterFilial.addEventListener('change', filterCpfTable);
    if (filterServico) filterServico.addEventListener('change', filterCpfTable);
    if (filterRecebimento) filterRecebimento.addEventListener('change', filterCpfTable);
    if (searchNome) searchNome.addEventListener('input', filterCpfTable);
    if (searchCpf) searchCpf.addEventListener('input', filterCpfTable);
    
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            filterFilial.value = '';
            filterServico.value = '';
            filterRecebimento.value = '';
            searchNome.value = '';
            searchCpf.value = '';
            filterCpfTable();
            showToast('Filtros limpos com sucesso.', 'success');
        });
    }

    function handleFile(file) {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const filename = file.name;
        const fileExt = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExt)) {
            showToast('Formato inválido! Envie um arquivo Excel (.xlsx, .xls) ou CSV.', 'error');
            return;
        }

        // Switch to loading UI
        uploadSectionCpf.classList.remove('active');
        processingSection.classList.add('active');
        progressBar.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 85) {
                progress += Math.random() * 15;
                if (progress > 85) progress = 85;
                progressBar.style.width = `${progress}%`;
            }
        }, 150);

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            clearInterval(interval);
            
            if (status !== 200) {
                throw new Error(body.error || 'Erro no servidor ao processar arquivo.');
            }
            
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                appData.originalFilename = body.filename;
                appData.columns = body.columns;
                appData.previewData = body.preview_data;
                appData.cpfColumn = body.cpf_column;
                appData.downloadUrl = `/download/${body.file_id}?name=${encodeURIComponent(body.download_name)}`;
                
                btnDownloadCpf.href = appData.downloadUrl;
                
                mapCpfColumns();
                populateCpfFilters();
                
                document.getElementById('info-filename').textContent = body.filename;
                document.getElementById('info-date').textContent = new Date().toLocaleString('pt-BR');
                document.getElementById('info-total').textContent = `${body.total_rows} registros`;
                document.getElementById('info-modified').textContent = `${body.modified_count} CPFs corrigidos`;
                
                renderCpfTable(appData.previewData);
                
                processingSection.classList.remove('active');
                dashboardSectionCpf.classList.add('active');
                
                showToast(`Planilha processada! ${body.modified_count} CPFs foram corrigidos.`, 'success');
            }, 500);
        })
        .catch(err => {
            clearInterval(interval);
            console.error(err);
            
            processingSection.classList.remove('active');
            uploadSectionCpf.classList.add('active');
            
            showToast(err.message || 'Erro de conexão com o servidor.', 'error');
        });
    }

    function mapCpfColumns() {
        const columns = appData.columns;
        appData.mapping.cpf = appData.cpfColumn;
        appData.mapping.filial = findColMatch(columns, ['id_filial', 'id filial', 'filial', 'idfilial', 'unidade']);
        appData.mapping.servico = findColMatch(columns, ['serviço', 'servico', 'service', 'tipo de serviço', 'tipo serviço']);
        appData.mapping.recebimento = findColMatch(columns, ['tipo_recebimento', 'tipo recebimento', 'recebimento', 'tipo de recebimento', 'forma pagamento']);
        appData.mapping.nome = findColMatch(columns, ['nome', 'name', 'cliente', 'nome do cliente']);
    }

    function findColMatch(columns, candidates) {
        for (let cand of candidates) {
            let match = columns.find(c => c.toLowerCase().trim() === cand);
            if (match) return match;
        }
        for (let cand of candidates) {
            let match = columns.find(c => c.toLowerCase().includes(cand));
            if (match) return match;
        }
        return null;
    }

    function populateCpfFilters() {
        const data = appData.previewData;
        
        if (appData.mapping.filial) {
            const filiais = [...new Set(data.map(row => row[appData.mapping.filial]).filter(Boolean))].sort();
            filiais.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                filterFilial.appendChild(opt);
            });
        }
        
        if (appData.mapping.servico) {
            const servicos = [...new Set(data.map(row => row[appData.mapping.servico]).filter(Boolean))].sort();
            servicos.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                filterServico.appendChild(opt);
            });
        }
        
        if (appData.mapping.recebimento) {
            const recebimentos = [...new Set(data.map(row => row[appData.mapping.recebimento]).filter(Boolean))].sort();
            recebimentos.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                filterRecebimento.appendChild(opt);
            });
        }
    }

    function renderCpfTable(dataList) {
        const tbody = document.getElementById('table-body');
        const theadRow = document.getElementById('table-header-row');
        const noResults = document.getElementById('no-results');
        
        tbody.innerHTML = '';
        theadRow.innerHTML = '';
        
        if (dataList.length === 0) {
            noResults.style.display = 'flex';
            document.getElementById('preview-count').textContent = '0';
            document.getElementById('total-count-label').textContent = String(appData.previewData.length);
            return;
        }
        noResults.style.display = 'none';

        appData.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            theadRow.appendChild(th);
        });

        dataList.forEach(row => {
            const tr = document.createElement('tr');
            
            appData.columns.forEach(col => {
                const td = document.createElement('td');
                const cellVal = row[col] || '';
                
                if (col === appData.cpfColumn) {
                    if (row['_is_cpf_modified']) {
                        td.innerHTML = `
                            <span class="cpf-badge modified" title="CPF original: ${row['_original_cpf']}">
                                <i data-lucide="sparkles"></i>
                                ${cellVal}
                            </span>
                        `;
                    } else {
                        td.innerHTML = `<span class="cpf-badge">${cellVal}</span>`;
                    }
                } else {
                    td.textContent = cellVal;
                    td.title = cellVal;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        document.getElementById('preview-count').textContent = String(dataList.length);
        document.getElementById('total-count-label').textContent = String(appData.previewData.length);

        lucide.createIcons();
    }

    function filterCpfTable() {
        const valFilial = filterFilial.value;
        const valServico = filterServico.value;
        const valRecebimento = filterRecebimento.value;
        const valNome = searchNome.value.toLowerCase().trim();
        const valCpf = searchCpf.value.replace(/\D/g, '');

        const filtered = appData.previewData.filter(row => {
            if (valFilial && appData.mapping.filial) {
                if (row[appData.mapping.filial] !== valFilial) return false;
            }
            if (valServico && appData.mapping.servico) {
                if (row[appData.mapping.servico] !== valServico) return false;
            }
            if (valRecebimento && appData.mapping.recebimento) {
                if (row[appData.mapping.recebimento] !== valRecebimento) return false;
            }
            if (valNome && appData.mapping.nome) {
                const nameVal = (row[appData.mapping.nome] || '').toLowerCase();
                if (!nameVal.includes(valNome)) return false;
            }
            if (valCpf && appData.mapping.cpf) {
                const cpfVal = (row[appData.mapping.cpf] || '').replace(/\D/g, '');
                if (!cpfVal.includes(valCpf)) return false;
            }
            return true;
        });

        renderCpfTable(filtered);
    }

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        lucide.createIcons();
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

});
