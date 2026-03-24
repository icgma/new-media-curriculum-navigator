// 课程导航应用主脚本
class CourseNavigator {
    constructor() {
        this.courses = {};
        this.filteredCourses = {};
        this.selectedCourse = null;
        this.currentView = 'card';
        this.editMode = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadCourseData();
            this.setupEventListeners();
            this.populateFilters();
            this.renderCourses();
            this.renderSemesterView();
            this.renderStatsView();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('加载课程数据失败，请刷新页面重试');
        }
    }

    // AES-256-CBC decryption via Web Crypto API
    async decryptData(encryptedBuffer, password) {
        const PBKDF2_ITERATIONS = 100000;
        const data = new Uint8Array(encryptedBuffer);
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 32);
        const ciphertext = data.slice(32);

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
        );
        const aesKey = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-CBC', length: 256 },
            false,
            ['decrypt']
        );
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            aesKey,
            ciphertext
        );
        return new TextDecoder().decode(decrypted);
    }

    async loadCourseData() {
        try {
            let data;
            try {
                // Load encrypted data file
                const response = await fetch('curriculum_data_real.json.enc');
                if (!response.ok) throw new Error('无法加载加密数据');
                const encBuf = await response.arrayBuffer();
                const jsonStr = await this.decryptData(encBuf, '31a27z2935');
                data = JSON.parse(jsonStr);
                console.log('成功加载并解密课程数据');
            } catch (fetchError) {
                console.log('加载加密数据失败，尝试加载明文数据:', fetchError);
                // Fallback: try plain JSON (for local dev)
                try {
                    const resp2 = await fetch('curriculum_data_real.json');
                    if (resp2.ok) {
                        data = await resp2.json();
                        console.log('成功加载明文课程数据');
                    } else {
                        throw new Error('明文数据也不可用');
                    }
                } catch (e2) {
                    console.error('所有数据源均不可用:', e2);
                    throw e2;
                }
            }

            this.courses = data.courses;
            this.filteredCourses = { ...this.courses };
            console.log('课程数据加载成功:', Object.keys(this.courses).length, '门课程');
        } catch (error) {
            console.error('加载课程数据失败:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // 筛选器事件
        document.getElementById('semesterFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('groupFilter').addEventListener('change', () => this.updateSubgroupFilter());
        document.getElementById('subgroupFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());

        // 视图切换事件
        document.getElementById('cardViewBtn').addEventListener('click', () => this.switchView('card'));
        document.getElementById('semesterViewBtn').addEventListener('click', () => this.switchView('semester'));
        document.getElementById('statsViewBtn').addEventListener('click', () => this.switchView('stats'));
        document.getElementById('editModeBtn').addEventListener('click', () => this.toggleEditMode());
    }

    populateFilters() {
        // 填充学期筛选器
        const semesters = [...new Set(Object.values(this.courses).map(course => course.semester))];
        const semesterFilter = document.getElementById('semesterFilter');

        semesters.sort().forEach(semester => {
            const option = document.createElement('option');
            option.value = semester;
            option.textContent = semester;
            semesterFilter.appendChild(option);
        });

        // 初始化子组筛选器
        this.updateSubgroupFilter();
    }

    updateSubgroupFilter() {
        const groupFilter = document.getElementById('groupFilter');
        const subgroupFilter = document.getElementById('subgroupFilter');
        const selectedGroup = groupFilter.value;

        // 清空子组选项
        subgroupFilter.innerHTML = '<option value="">全部子组</option>';

        if (selectedGroup) {
            // 获取选中课程组的所有子组
            const subgroups = [...new Set(
                Object.values(this.courses)
                    .filter(course => course.course_group === selectedGroup)
                    .map(course => course.course_subgroup)
            )];

            subgroups.sort().forEach(subgroup => {
                const option = document.createElement('option');
                option.value = subgroup;
                option.textContent = subgroup;
                subgroupFilter.appendChild(option);
            });
        } else {
            // 显示所有子组
            const allSubgroups = [...new Set(Object.values(this.courses).map(course => course.course_subgroup))];
            allSubgroups.sort().forEach(subgroup => {
                const option = document.createElement('option');
                option.value = subgroup;
                option.textContent = subgroup;
                subgroupFilter.appendChild(option);
            });
        }

        // 应用筛选
        this.applyFilters();
    }

    applyFilters() {
        const semesterFilter = document.getElementById('semesterFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const groupFilter = document.getElementById('groupFilter').value;
        const subgroupFilter = document.getElementById('subgroupFilter').value;
        const searchInput = document.getElementById('searchInput').value.toLowerCase();

        this.filteredCourses = {};

        Object.entries(this.courses).forEach(([code, course]) => {
            let include = true;

            // 学期筛选
            if (semesterFilter && course.semester !== semesterFilter) {
                include = false;
            }

            // 类型筛选
            if (typeFilter && course.course_type !== typeFilter) {
                include = false;
            }

            // 课程组筛选
            if (groupFilter && course.course_group !== groupFilter) {
                include = false;
            }

            // 课程子组筛选
            if (subgroupFilter && course.course_subgroup !== subgroupFilter) {
                include = false;
            }

            // 搜索筛选
            if (searchInput &&
                !course.name.toLowerCase().includes(searchInput) &&
                !course.code.toLowerCase().includes(searchInput)) {
                include = false;
            }

            if (include) {
                this.filteredCourses[code] = course;
            }
        });

        this.renderCourses();
        this.renderSemesterView();
        this.renderStatsView();
    }

    renderCourses() {
        const container = document.getElementById('cardView');
        container.innerHTML = '';

        Object.entries(this.filteredCourses).forEach(([code, course]) => {
            const courseCard = this.createCourseCard(code, course);
            container.appendChild(courseCard);
        });

        if (Object.keys(this.filteredCourses).length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; font-size: 18px; padding: 40px;">没有找到符合条件的课程</div>';
        }
    }

    createCourseCard(code, course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.dataset.courseCode = code;

        // 获取前置课程信息
        const prerequisites = course.prerequisites || [];
        const prerequisiteElements = prerequisites.length > 0 
            ? prerequisites.map(prereqCode => {
                const prereqCourse = this.courses[prereqCode];
                const prereqName = prereqCourse ? prereqCourse.name : prereqCode;
                return `<span class="prerequisite-tag" data-course="${prereqCode}">${prereqName}</span>`;
            }).join('')
            : '<span class="no-prerequisites">无前置要求</span>';

        card.innerHTML = `
            <div class="course-type ${course.course_type}">${course.course_type}</div>
            <button class="edit-btn" onclick="courseNavigator.editCourse('${code}')">编辑</button>
            <div class="course-header">
                <div class="course-code">${course.code}</div>
                <div class="course-name">${course.name}</div>
                <div class="course-group-info">
                    <span class="course-group">📚 ${course.course_group}</span>
                    <span class="course-subgroup">📖 ${course.course_subgroup}</span>
                </div>
            </div>
            <div class="course-info">
                <span>📅 ${course.semester}</span>
                <span>⭐ ${course.credits}学分</span>
                <span>⏰ ${course.hours}学时</span>
            </div>
            <div class="course-description">${course.description || '暂无课程描述'}</div>
            <div class="prerequisites">
                <div class="prerequisites-title">前置课程:</div>
                <div class="prerequisite-list">${prerequisiteElements}</div>
            </div>
        `;

        // 添加点击事件
        card.addEventListener('click', () => this.selectCourse(code));

        // 为前置课程标签添加点击事件
        card.querySelectorAll('.prerequisite-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                const prereqCode = tag.dataset.course;
                this.highlightCourse(prereqCode);
            });
        });

        return card;
    }

    selectCourse(courseCode) {
        // 移除之前的选中状态
        document.querySelectorAll('.course-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // 添加新的选中状态
        const selectedCard = document.querySelector(`[data-course-code="${courseCode}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            this.selectedCourse = courseCode;
            
            // 高亮显示相关课程
            this.highlightRelatedCourses(courseCode);
        }
    }

    highlightCourse(courseCode) {
        const card = document.querySelector(`[data-course-code="${courseCode}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.animation = 'pulse 1s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 1000);
        }
    }

    highlightRelatedCourses(courseCode) {
        const course = this.courses[courseCode];
        if (!course) return;

        // 重置所有卡片样式
        document.querySelectorAll('.course-card').forEach(card => {
            card.style.opacity = '0.5';
        });

        // 高亮当前课程
        const currentCard = document.querySelector(`[data-course-code="${courseCode}"]`);
        if (currentCard) {
            currentCard.style.opacity = '1';
        }

        // 高亮前置课程
        course.prerequisites.forEach(prereqCode => {
            const prereqCard = document.querySelector(`[data-course-code="${prereqCode}"]`);
            if (prereqCard) {
                prereqCard.style.opacity = '1';
                prereqCard.style.border = '2px solid #ff6b6b';
            }
        });

        // 高亮后续课程（以当前课程为前置的课程）
        Object.entries(this.courses).forEach(([code, c]) => {
            if (c.prerequisites.includes(courseCode)) {
                const nextCard = document.querySelector(`[data-course-code="${code}"]`);
                if (nextCard) {
                    nextCard.style.opacity = '1';
                    nextCard.style.border = '2px solid #4ecdc4';
                }
            }
        });

        // 3秒后恢复正常样式
        setTimeout(() => {
            document.querySelectorAll('.course-card').forEach(card => {
                card.style.opacity = '1';
                card.style.border = '';
            });
        }, 3000);
    }

    renderSemesterView() {
        const container = document.querySelector('#semesterView .semester-grid');
        container.innerHTML = '';

        // 按学期分组课程
        const semesterGroups = {};
        Object.entries(this.filteredCourses).forEach(([code, course]) => {
            const semester = course.semester;
            if (!semesterGroups[semester]) {
                semesterGroups[semester] = [];
            }
            semesterGroups[semester].push({ code, ...course });
        });

        // 排序学期
        const sortedSemesters = Object.keys(semesterGroups).sort();

        sortedSemesters.forEach(semester => {
            const semesterColumn = document.createElement('div');
            semesterColumn.className = 'semester-column';

            const semesterTitle = document.createElement('div');
            semesterTitle.className = 'semester-title';
            semesterTitle.textContent = semester;

            semesterColumn.appendChild(semesterTitle);

            semesterGroups[semester].forEach(course => {
                const courseElement = document.createElement('div');
                courseElement.className = `semester-course ${course.course_type}`;
                courseElement.dataset.courseCode = course.code;
                courseElement.innerHTML = `
                    <div style="font-weight: bold;">${course.name}</div>
                    <div style="font-size: 12px; color: #666;">${course.credits}学分 | ${course.hours}学时</div>
                `;

                courseElement.addEventListener('click', () => {
                    this.switchView('card');
                    setTimeout(() => this.selectCourse(course.code), 100);
                });

                semesterColumn.appendChild(courseElement);
            });

            container.appendChild(semesterColumn);
        });
    }

    renderStatsView() {
        const container = document.getElementById('statsContent');

        // 计算各课程组的学分统计
        const stats = {
            '公共课': {},
            '专业课程': {}
        };

        Object.values(this.filteredCourses).forEach(course => {
            const group = course.course_group;
            const subgroup = course.course_subgroup;

            if (!stats[group]) stats[group] = {};
            if (!stats[group][subgroup]) {
                stats[group][subgroup] = { credits: 0, courses: 0 };
            }

            stats[group][subgroup].credits += course.credits;
            stats[group][subgroup].courses += 1;
        });

        let html = '<h2 style="text-align: center; margin-bottom: 30px; color: #333;">📊 学分分布统计</h2>';

        Object.entries(stats).forEach(([group, subgroups]) => {
            if (Object.keys(subgroups).length === 0) return;

            const totalCredits = Object.values(subgroups).reduce((sum, sg) => sum + sg.credits, 0);
            const totalCourses = Object.values(subgroups).reduce((sum, sg) => sum + sg.courses, 0);

            html += `
                <div style="background: white; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                        ${group} (${totalCredits}学分, ${totalCourses}门课程)
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            `;

            Object.entries(subgroups).forEach(([subgroup, data]) => {
                const percentage = ((data.credits / totalCredits) * 100).toFixed(1);
                html += `
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #667eea;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 8px;">${subgroup}</div>
                        <div style="color: #666; font-size: 14px;">
                            <div>📚 ${data.courses}门课程</div>
                            <div>⭐ ${data.credits}学分 (${percentage}%)</div>
                        </div>
                        <div style="background: #e0e0e0; height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="background: #667eea; height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
                        </div>
                    </div>
                `;
            });

            html += '</div></div>';
        });

        // 添加总体统计
        const allCredits = Object.values(this.filteredCourses).reduce((sum, course) => sum + course.credits, 0);
        const allCourses = Object.keys(this.filteredCourses).length;

        html += `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; padding: 20px; text-align: center;">
                <h3 style="margin-bottom: 15px;">📈 总体统计</h3>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold;">${allCourses}</div>
                        <div style="opacity: 0.9;">门课程</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold;">${allCredits}</div>
                        <div style="opacity: 0.9;">总学分</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold;">${(allCredits / allCourses).toFixed(1)}</div>
                        <div style="opacity: 0.9;">平均学分</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const editBtn = document.getElementById('editModeBtn');
        const container = document.querySelector('.container');

        if (this.editMode) {
            editBtn.classList.add('active');
            editBtn.textContent = '退出编辑';
            container.classList.add('edit-mode');

            // 添加编辑模式提示
            if (!document.querySelector('.edit-mode-notice')) {
                const notice = document.createElement('div');
                notice.className = 'edit-mode-notice';
                notice.innerHTML = '📝 编辑模式已开启，点击课程卡片上的"编辑"按钮可修改课程信息';
                container.insertBefore(notice, container.firstChild.nextSibling);
            }
        } else {
            editBtn.classList.remove('active');
            editBtn.textContent = '编辑模式';
            container.classList.remove('edit-mode');

            // 移除编辑模式提示
            const notice = document.querySelector('.edit-mode-notice');
            if (notice) {
                notice.remove();
            }
        }
    }

    editCourse(courseCode) {
        if (!this.editMode) return;

        const course = this.courses[courseCode];
        if (!course) return;

        // 创建编辑模态框
        const modal = document.createElement('div');
        modal.className = 'edit-modal';
        modal.innerHTML = `
            <div class="edit-form">
                <h3>编辑课程信息</h3>
                <div class="form-group">
                    <label for="editCode">课程代码:</label>
                    <input type="text" id="editCode" value="${course.code}">
                </div>
                <div class="form-group">
                    <label for="editName">课程名称:</label>
                    <input type="text" id="editName" value="${course.name}">
                </div>
                <div class="form-group">
                    <label for="editCredits">学分:</label>
                    <input type="number" id="editCredits" value="${course.credits}" step="0.5" min="0">
                </div>
                <div class="form-group">
                    <label for="editHours">学时:</label>
                    <input type="number" id="editHours" value="${course.hours}" min="0">
                </div>
                <div class="form-group">
                    <label for="editSemester">建议修读学期:</label>
                    <input type="text" id="editSemester" value="${course.semester}" placeholder="例如: 1、2、3-6、1-8">
                </div>
                <div class="form-group">
                    <label for="editType">课程类型:</label>
                    <select id="editType">
                        <option value="必修" ${course.course_type === '必修' ? 'selected' : ''}>必修</option>
                        <option value="限选" ${course.course_type === '限选' ? 'selected' : ''}>限选</option>
                        <option value="选修" ${course.course_type === '选修' ? 'selected' : ''}>选修</option>
                        <option value="实践" ${course.course_type === '实践' ? 'selected' : ''}>实践</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editGroup">课程组:</label>
                    <select id="editGroup">
                        <option value="公共课" ${course.course_group === '公共课' ? 'selected' : ''}>公共课</option>
                        <option value="专业课程" ${course.course_group === '专业课程' ? 'selected' : ''}>专业课程</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editSubgroup">课程子组:</label>
                    <select id="editSubgroup">
                        <option value="外语课程" ${course.course_subgroup === '外语课程' ? 'selected' : ''}>外语课程</option>
                        <option value="计算机基础课程" ${course.course_subgroup === '计算机基础课程' ? 'selected' : ''}>计算机基础课程</option>
                        <option value="公共必修课程" ${course.course_subgroup === '公共必修课程' ? 'selected' : ''}>公共必修课程</option>
                        <option value="通选课程" ${course.course_subgroup === '通选课程' ? 'selected' : ''}>通选课程</option>
                        <option value="专业基础课" ${course.course_subgroup === '专业基础课' ? 'selected' : ''}>专业基础课</option>
                        <option value="专业必修课" ${course.course_subgroup === '专业必修课' ? 'selected' : ''}>专业必修课</option>
                        <option value="专业选修课" ${course.course_subgroup === '专业选修课' ? 'selected' : ''}>专业选修课</option>
                        <option value="实践环节" ${course.course_subgroup === '实践环节' ? 'selected' : ''}>实践环节</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editDescription">课程描述:</label>
                    <textarea id="editDescription" placeholder="请输入课程描述">${course.description || ''}</textarea>
                </div>
                <div class="form-buttons">
                    <button class="save-btn" onclick="courseNavigator.saveCourse('${courseCode}')">保存</button>
                    <button class="cancel-btn" onclick="courseNavigator.closeEditModal()">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    }

    saveCourse(courseCode) {
        const course = this.courses[courseCode];
        if (!course) return;

        // 获取表单数据
        const newCode = document.getElementById('editCode').value.trim();
        const newName = document.getElementById('editName').value.trim();
        const newCredits = parseFloat(document.getElementById('editCredits').value);
        const newHours = parseInt(document.getElementById('editHours').value);
        const newSemester = document.getElementById('editSemester').value.trim();
        const newType = document.getElementById('editType').value;
        const newGroup = document.getElementById('editGroup').value;
        const newSubgroup = document.getElementById('editSubgroup').value;
        const newDescription = document.getElementById('editDescription').value.trim();

        // 验证数据
        if (!newCode || !newName || isNaN(newCredits) || isNaN(newHours) || !newSemester) {
            alert('请填写所有必填字段！');
            return;
        }

        // 如果课程代码改变了，需要更新引用
        if (newCode !== courseCode) {
            // 检查新代码是否已存在
            if (this.courses[newCode]) {
                alert('课程代码已存在！');
                return;
            }

            // 更新前置课程引用
            Object.values(this.courses).forEach(c => {
                const index = c.prerequisites.indexOf(courseCode);
                if (index !== -1) {
                    c.prerequisites[index] = newCode;
                }
            });

            // 删除旧的课程记录
            delete this.courses[courseCode];
        }

        // 更新课程信息
        const updatedCourse = {
            ...course,
            code: newCode,
            name: newName,
            credits: newCredits,
            hours: newHours,
            semester: newSemester,
            course_type: newType,
            course_group: newGroup,
            course_subgroup: newSubgroup,
            description: newDescription
        };

        this.courses[newCode] = updatedCourse;

        // 关闭模态框
        this.closeEditModal();

        // 重新渲染
        this.applyFilters();

        alert('课程信息已更新！');
    }

    closeEditModal() {
        const modal = document.querySelector('.edit-modal');
        if (modal) {
            modal.remove();
        }
    }

    switchView(viewType) {
        const cardView = document.getElementById('cardView');
        const semesterView = document.getElementById('semesterView');
        const statsView = document.getElementById('statsView');
        const cardBtn = document.getElementById('cardViewBtn');
        const semesterBtn = document.getElementById('semesterViewBtn');
        const statsBtn = document.getElementById('statsViewBtn');

        // 隐藏所有视图
        cardView.classList.add('hidden');
        semesterView.classList.add('hidden');
        statsView.classList.add('hidden');

        // 移除所有按钮的active状态
        cardBtn.classList.remove('active');
        semesterBtn.classList.remove('active');
        statsBtn.classList.remove('active');

        // 显示选中的视图
        if (viewType === 'card') {
            cardView.classList.remove('hidden');
            cardBtn.classList.add('active');
            this.currentView = 'card';
        } else if (viewType === 'semester') {
            semesterView.classList.remove('hidden');
            semesterBtn.classList.add('active');
            this.currentView = 'semester';
        } else if (viewType === 'stats') {
            statsView.classList.remove('hidden');
            statsBtn.classList.add('active');
            this.currentView = 'stats';
        }
    }

    showError(message) {
        const container = document.getElementById('cardView');
        container.innerHTML = `
            <div style="text-align: center; color: #ff6b6b; font-size: 18px; padding: 40px;">
                ❌ ${message}
            </div>
        `;
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// 初始化应用
let courseNavigator;
document.addEventListener('DOMContentLoaded', () => {
    courseNavigator = new CourseNavigator();
});
