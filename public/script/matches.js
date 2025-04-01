$(document).ready(function () {
    $('.fold').each(function () {
        var elems_to_hide = ( $(this).prop('tagName') == 'UL') ? $(this).find("li:gt('1')") : $(this).find("p:gt('1')");
        elems_to_hide.wrapAll("<div class='below-fold' />")
        var below_fold_container = $(this).find('div.below-fold');
        var elem_preceding_button = ($(this).prop('tagName') == 'UL') ? $(this) : below_fold_container;
        below_fold_container.hide().end()
        if (below_fold_container.length) {
            elem_preceding_button.after('<button class="matches-toggle badge badge-light badge-pill border mx-auto mt-2 mb-2"><i class="fas fa-angle-double-down"></i> MORE <i class="fas fa-angle-double-down"></i></button>');
        }
        elem_preceding_button.next($('button.matches-toggle')).click(function () {
            var button = $(this);
            var below_fold_container = (button.prev().find('div.below-fold').length) ?  button.prev().find('div.below-fold') : button.closest('.fold').find('div.below-fold');
            below_fold_container.slideToggle().promise().done(function () {
                        var fewer_button_text = ($(this).children().prop('tagName') == 'LI') ? 'FEWER' : 'LESS';
                if (button.is(":visible")) {
                    if (button.text().includes('MORE')) {
                        button.html('<i class="fas fa-angle-double-up"></i> '+fewer_button_text+' <i class="fas fa-angle-double-up"></i>');
                    } else {
                        button.html('<i class="fas fa-angle-double-down"></i> MORE <i class="fas fa-angle-double-down"></i>')
                    }
                }
            });
        });
    });
});