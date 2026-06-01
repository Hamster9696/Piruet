// Студия «Пируэт» — клиентская логика сайта

document.addEventListener('DOMContentLoaded', function () {
    setYear();
    setupBurger();
    markActiveLink();
    setupScheduleFilter();
    setupBookingForm();
    setupGallery();
});

// Год в подвале
function setYear() {
    var el = document.querySelector('[data-year]');
    if (el) {
        el.textContent = new Date().getFullYear();
    }
}

// Мобильное меню
function setupBurger() {
    var burger = document.querySelector('.burger');
    var nav = document.querySelector('.nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', function () {
        burger.classList.toggle('is-open');
        nav.classList.toggle('is-open');
    });

    // закрыть меню по клику на ссылку
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            burger.classList.remove('is-open');
            nav.classList.remove('is-open');
        });
    });
}

// Подсветка текущего пункта меню
function markActiveLink() {
    var current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(function (link) {
        var href = link.getAttribute('href');
        if (href === current) {
            link.classList.add('is-active');
        }
    });
}

// Фильтр расписания по направлению.
// Строки сгруппированы по возрасту заголовками-разделителями (.schedule__group);
// при фильтрации прячем те заголовки, под которыми не осталось видимых занятий.
function setupScheduleFilter() {
    var buttons = document.querySelectorAll('.filter button');
    var tbody = document.querySelector('.schedule tbody');
    if (!buttons.length || !tbody) return;

    var rows = Array.prototype.slice.call(tbody.children);

    function apply(group) {
        // 1) показываем/прячем строки занятий
        rows.forEach(function (row) {
            if (row.classList.contains('schedule__group')) return;
            var match = group === 'all' || row.dataset.group === group;
            row.style.display = match ? '' : 'none';
        });

        // 2) проходим сверху вниз: каждый заголовок виден,
        //    только если под ним (до следующего заголовка) есть видимое занятие
        var header = null, visibleUnder = 0;
        rows.forEach(function (row) {
            if (row.classList.contains('schedule__group')) {
                if (header) header.style.display = visibleUnder ? '' : 'none';
                header = row;
                visibleUnder = 0;
            } else if (row.style.display !== 'none') {
                visibleUnder++;
            }
        });
        if (header) header.style.display = visibleUnder ? '' : 'none';
    }

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            buttons.forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            apply(btn.dataset.filter);
        });
    });
}

// Форма записи на пробное занятие
function setupBookingForm() {
    var form = document.querySelector('#booking-form');
    if (!form) return;

    var success = form.querySelector('.form__success');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var ok = true;
        clearErrors(form);

        var name = form.elements['name'];
        var phone = form.elements['phone'];
        var direction = form.elements['direction'];
        var agree = form.elements['agree'];

        if (name.value.trim().length < 2) {
            showError(name, 'Введите имя');
            ok = false;
        }

        // телефон: только цифры, +, скобки, пробелы и дефисы; минимум 10 цифр
        var digits = phone.value.replace(/\D/g, '');
        if (digits.length < 10) {
            showError(phone, 'Укажите корректный номер телефона');
            ok = false;
        }

        if (!direction.value) {
            showError(direction, 'Выберите направление');
            ok = false;
        }

        if (!agree.checked) {
            showError(agree, 'Нужно согласие на обработку данных');
            ok = false;
        }

        if (!ok) return;

        saveApplication({
            name: name.value.trim(),
            phone: phone.value.trim(),
            direction: direction.value,
            comment: form.elements['comment'].value.trim(),
            createdAt: new Date().toISOString()
        });

        form.reset();
        if (success) {
            success.classList.add('is-visible');
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function showError(input, text) {
    var field = input.closest('.field') || input.closest('.checkbox');
    if (!field) return;
    field.classList.add('has-error');
    var box = field.querySelector('.field__error');
    if (box) box.textContent = text;
}

function clearErrors(form) {
    form.querySelectorAll('.has-error').forEach(function (f) {
        f.classList.remove('has-error');
    });
    var success = form.querySelector('.form__success');
    if (success) success.classList.remove('is-visible');
}

// Сохраняем заявку в localStorage (имитация записи в БД)
function saveApplication(data) {
    var key = 'plie_applications';
    var list = [];
    try {
        list = JSON.parse(localStorage.getItem(key)) || [];
    } catch (err) {
        list = [];
    }
    list.push(data);
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
        // приватный режим браузера или переполнение хранилища —
        // не роняем форму, заявку просто не сохраняем локально
    }
}

// Галерея с просмотром изображения
function setupGallery() {
    var items = document.querySelectorAll('.gallery-grid figure');
    var box = document.querySelector('.lightbox');
    if (!items.length || !box) return;

    var stage = box.querySelector('.lightbox__stage');
    var current = 0;

    function open(index) {
        current = index;
        var item = items[current];
        stage.textContent = item.dataset.caption || 'Фото ' + (current + 1);
        // background-shorthand из getComputedStyle отдаётся не всеми браузерами одинаково —
        // берём картинку (градиент), а если её нет — цвет
        var cs = getComputedStyle(item);
        stage.style.background = (cs.backgroundImage && cs.backgroundImage !== 'none')
            ? cs.backgroundImage
            : cs.backgroundColor;
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
    }

    function close() {
        box.classList.remove('is-open');
        box.setAttribute('aria-hidden', 'true');
    }

    function step(delta) {
        current = (current + delta + items.length) % items.length;
        open(current);
    }

    items.forEach(function (item, i) {
        item.addEventListener('click', function () { open(i); });
    });

    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.prev').addEventListener('click', function () { step(-1); });
    box.querySelector('.next').addEventListener('click', function () { step(1); });

    box.addEventListener('click', function (e) {
        if (e.target === box) close();
    });

    document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
}
